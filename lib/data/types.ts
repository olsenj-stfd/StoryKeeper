import type {
  Story,
  StoryNode,
  Session,
  StoryBible,
  World,
  CoverHue,
} from '../types';

export type DataAdapter = {
  // Worlds
  listWorlds(): Promise<World[]>;
  createWorld(input: { name: string; description?: string; coverHue?: CoverHue }): Promise<World>;

  // Stories
  getStory(storyId: string): Promise<Story | null>;
  listStoriesByWorld(worldId: string): Promise<Story[]>;
  createStory(input: { worldId: string; title: string }): Promise<Story>;

  // Nodes
  listNodes(storyId: string): Promise<StoryNode[]>;
  appendNode(
    node: Omit<StoryNode, 'id' | 'createdAt' | 'audioUrl'>,
    audioBlob?: Blob,
  ): Promise<StoryNode>;

  // Session (kid's place in a story)
  getSession(storyId: string): Promise<Session | null>;
  setSession(session: Session): Promise<void>;

  // Live updates
  subscribe(storyId: string, callback: () => void): () => void;
  subscribeAll(callback: () => void): () => void;

  // Reset & bibles
  resetStory(storyId: string): Promise<void>;
  getStoryBible(storyId: string): Promise<StoryBible | null>;
  setStoryBible(bible: StoryBible): Promise<void>;
};
