import type { Story, StoryNode, World } from './types';

export const DEFAULT_FAMILY_ID = 'family-1';
export const DEFAULT_WORLD_ID = 'garden';
export const DEFAULT_STORY_ID = 'garden';

export const SEED_WORLD: World = {
  id: DEFAULT_WORLD_ID,
  name: 'The Garden',
  description: 'Stories from a garden behind an old stone wall.',
  familyId: DEFAULT_FAMILY_ID,
  coverHue: 'mint',
  createdAt: 0,
};

export const SEED_STORY: Story = {
  id: DEFAULT_STORY_ID,
  worldId: DEFAULT_WORLD_ID,
  title: 'The Garden with the Purple Door',
  familyId: DEFAULT_FAMILY_ID,
  createdAt: 0,
};

export const SEED_NODES: StoryNode[] = [
  {
    id: 'seed-1',
    storyId: DEFAULT_STORY_ID,
    parentNodeId: null,
    type: 'voice',
    who: 'Mom',
    text: "Once upon a time, there was a garden tucked behind an old stone wall. At the very back of the garden, hidden by a curtain of ivy, there was a tiny purple door — just the right size for a kid your age. Nobody knew where it went. One sunny afternoon, you decided you wanted to find out.",
    audioUrl: null,
    branchLabel: null,
    branchIcon: null,
    orderIndex: 0,
    createdAt: 0,
  },
];
