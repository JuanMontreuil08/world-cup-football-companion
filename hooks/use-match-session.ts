'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { RealtimeSession } from '@openai/agents/realtime';
import { agent } from '@/lib/agent';
import { getEphemeralKey } from '@/app/server/token.action';
import { SESSION_LIMIT_MS } from '@/lib/config';

export type SessionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
export type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';

export interface SessionState {
  status: SessionStatus;
  isMuted: boolean;
  orbState: OrbState;
  error?: string;
}

export function useMatchSession() {
  const sessionRef = useRef<RealtimeSession | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [state, setState] = useState<SessionState>({
    status: 'disconnected',
    isMuted: false,
    orbState: 'idle',
  });

  const setOrb = (orbState: OrbState) =>
    setState((s) => ({ ...s, orbState }));

  const connect = useCallback(async () => {
    setState((s) => ({ ...s, status: 'connecting' }));

    try {
      const key = await getEphemeralKey();

      const session = new RealtimeSession(agent, {
        config: {
          audio: { input: { turnDetection: { type: 'server_vad' } } },
        },
      });

      session.on('transport_event', (event: { type: string }) => {
        if (event.type === 'input_audio_buffer.speech_started') setOrb('listening');
        if (event.type === 'input_audio_buffer.speech_stopped') setOrb('thinking');
        if (event.type === 'response.audio.delta') setOrb('speaking');
        if (event.type === 'response.done') setOrb('idle');
      });

      session.on('error', (err: { type: 'error'; error: unknown }) => {
        console.error('[session] error', err);
        const message = err.error instanceof Error ? err.error.message : String(err.error);
        setState((s) => ({ ...s, status: 'error', orbState: 'error', error: message }));
      });

      await session.connect({ apiKey: key });

      sessionRef.current = session;
      setState((s) => ({ ...s, status: 'connected', orbState: 'idle', error: undefined }));

      // Auto-reconnect before the 60min hard limit
      reconnectTimerRef.current = setTimeout(() => {
        console.info('[session] Auto-reconnecting at 55min...');
        reconnect();
      }, SESSION_LIMIT_MS);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connection failed';
      console.error('[session] connect failed', err);
      setState((s) => ({ ...s, status: 'error', orbState: 'error', error: message }));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    sessionRef.current?.close();
    sessionRef.current = null;
    setState({ status: 'disconnected', isMuted: false, orbState: 'idle' });
  }, []);

  const reconnect = useCallback(async () => {
    sessionRef.current?.close();
    sessionRef.current = null;
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    await connect();
  }, [connect]);

  const toggleMute = useCallback(() => {
    if (!sessionRef.current) return;
    const next = !state.isMuted;
    sessionRef.current.mute(next);
    setState((s) => ({ ...s, isMuted: next }));
  }, [state.isMuted]);

  const getSession = useCallback(() => sessionRef.current, []);

  // Inject text into conversation context without triggering a response.
  // Use this to seed player roster, match context, etc. after connecting.
  const injectContext = useCallback((text: string) => {
    const session = sessionRef.current;
    if (!session) return;
    session.transport.sendEvent({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text }],
      },
    });
    // No response.create — we don't want the agent to speak this out loud
  }, []);

  useEffect(() => () => { disconnect(); }, [disconnect]);

  return { state, connect, disconnect, toggleMute, getSession, injectContext };
}
