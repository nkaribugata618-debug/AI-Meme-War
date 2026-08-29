export interface ServerToClientEvents {
  stateUpdate: (state: CompetitionState) => void;
  timerUpdate: (data: { remainingSeconds: number; isPaused: boolean }) => void;
  participantCount: (count: number) => void;
  error: (msg: string) => void;
  voteUpdate: () => void; // Signals clients to re-fetch leaderboard
}

export interface ClientToServerEvents {
  joinRoom: (roomCode: string, role: "HOST" | "TEAM" | "AUDIENCE", entityId?: string) => void;
  hostCommand: (roomCode: string, command: HostCommand, payload?: Record<string, unknown>) => void;
  voteUpdateSignal: (roomCode: string) => void;
}

export type HostCommand = 
  | "START_ROUND" 
  | "PAUSE_TIMER" 
  | "RESUME_TIMER" 
  | "LOCK_SUBMISSIONS" 
  | "START_PRESENTATION" 
  | "NEXT_MEME"
  | "PREV_MEME"
  | "START_VOTING" 
  | "END_VOTING"
  | "REVEAL_TEAMS"
  | "NEXT_ROUND"
  | "END_COMPETITION";

export interface PresentationSubmission {
  id: string;
  teamName: string;
  imageUrl: string | null;
  aiScore: number | null;
  aiCommentary: string | null;
}

export interface CompetitionState {
  status: "LOBBY" | "ACTIVE" | "COMPLETED";
  roundStatus: "SETUP" | "ACTIVE" | "LOCKED" | "PRESENTATION" | "VOTING" | "COMPLETED";
  roundNumber: number;
  roundId: string | null;
  prompt: string;
  presentationSlideIndex: number;
  teamNamesRevealed: boolean;
  presentationSubmissions: PresentationSubmission[];
}

export const DEFAULT_STATE: CompetitionState = {
  status: "LOBBY",
  roundStatus: "SETUP",
  roundNumber: 0,
  roundId: null,
  prompt: "",
  presentationSlideIndex: 0,
  teamNamesRevealed: false,
  presentationSubmissions: [],
};
