export type NodeType = 'voice' | 'prompt' | 'kid_text';

export type StoryNode = {
  id: string;
  storyId: string;
  parentNodeId: string | null;
  type: NodeType;
  who: string;
  text: string | null;
  audioUrl: string | null;
  branchLabel: string | null;
  branchIcon: string | null;
  orderIndex: number;
  createdAt: number;
};

export type CoverHue = 'kid' | 'parent' | 'mint' | 'coral';

export type World = {
  id: string;
  name: string;
  description: string | null;
  familyId: string;
  coverHue: CoverHue;
  createdAt: number;
};

export type Story = {
  id: string;
  worldId: string;
  title: string;
  familyId: string;
  createdAt: number;
};

export type Session = {
  storyId: string;
  currentNodeId: string | null;
  updatedAt: number;
};

export type Character = {
  name: string;
  role: string;
  traits: string[];
};

export type StoryBible = {
  storyId: string;
  synopsis: string;
  characters: Character[];
  themes: string[];
  settings: string[];
  updatedAt: number;
  source?: string;
};
