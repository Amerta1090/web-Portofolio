import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAssistantSession } from "./useAssistantSession";

const makeId = () => {
  let n = 0;
  return () => `id-${++n}`;
};

afterEach(() => {
  vi.useRealTimers();
});

describe("useAssistantSession — reduced motion (instant, deterministic)", () => {
  it("sends a user message and gets full assistant reply instantly", () => {
    const { result } = renderHook(() =>
      useAssistantSession({ reducedMotion: true, idFactory: makeId() }),
    );

    act(() => {
      result.current.send("skill apa saja?");
    });

    const messages = result.current.messages;
    expect(messages[0].role).toBe("user");
    expect(messages[0].text).toBe("skill apa saja?");
    expect(messages[1].role).toBe("assistant");
    expect(messages[1].stage).toBe("done");
    expect(messages[1].text.length).toBeGreaterThan(0);
  });

  it("skips thinking: isThinking stays false", () => {
    const { result } = renderHook(() =>
      useAssistantSession({ reducedMotion: true, idFactory: makeId() }),
    );
    act(() => {
      result.current.send("halo");
    });
    expect(result.current.isThinking).toBe(false);
    expect(result.current.statusText).toBeNull();
  });

  it("reset clears messages", () => {
    const { result } = renderHook(() =>
      useAssistantSession({ reducedMotion: true, idFactory: makeId() }),
    );
    act(() => {
      result.current.send("halo");
    });
    expect(result.current.messages.length).toBe(2);
    act(() => {
      result.current.reset();
    });
    expect(result.current.messages).toEqual([]);
  });
});

describe("useAssistantSession — thinking + streaming", () => {
  it("goes through thinking then streams to done", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() =>
      useAssistantSession({
        reducedMotion: false,
        thinkingDelay: 300,
        streamInterval: 10,
        idFactory: makeId(),
      }),
    );

    act(() => {
      result.current.send("halo");
    });

    // After send: user + assistant (thinking) present.
    expect(result.current.messages[1].stage).toBe("thinking");
    expect(result.current.isThinking).toBe(true);

    // Advance past thinking delay -> streaming starts.
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current.isThinking).toBe(false);

    // Advance streaming until done (loop to cover full text length).
    let iterations = 0;
    while (result.current.messages[1].stage !== "done" && iterations < 10000) {
      act(() => {
        vi.advanceTimersByTime(10);
      });
      iterations++;
    }
    const last = result.current.messages[1];
    expect(last.stage).toBe("done");
    expect(last.text.length).toBeGreaterThan(0);
  });

  it("aborts in-flight reply when user sends again", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() =>
      useAssistantSession({
        reducedMotion: false,
        thinkingDelay: 5000,
        streamInterval: 10,
        idFactory: makeId(),
      }),
    );

    act(() => {
      result.current.send("halo");
    });
    // Advance partway through thinking.
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current.messages[1].stage).toBe("thinking");

    // User sends again while the first is still thinking -> abort + new reply.
    act(() => {
      result.current.send("whoami");
    });

    const messages = result.current.messages;
    // Sequence: user, assistant(aborted partial? full), user, assistant
    expect(messages.length).toBe(4);
    // The second (newest) assistant reply eventually completes.
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    // Stream the last message to completion.
    let iterations = 0;
    while (result.current.messages[3].stage !== "done" && iterations < 10000) {
      act(() => {
        vi.advanceTimersByTime(10);
      });
      iterations++;
    }
    expect(result.current.messages[3].stage).toBe("done");
  });
});
