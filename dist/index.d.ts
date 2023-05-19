declare const pvs: () => Promise<void>;

declare const init: (config: Record<string, `${string}-feature-${string}-${string}`>, name?: string) => void;

export { pvs as cli, init as git };
