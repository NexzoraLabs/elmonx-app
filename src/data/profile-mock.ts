export type CollectorSuggestion = {
  id: string;
  name: string;
  memberSince: string;
  color: string;
};

export type UserProfile = {
  id: string;
  name: string;
  memberSince: string;
  avatarColor: string;
  postCount: number;
  followersCount: string;
  followingCount: number;
  suggestions: CollectorSuggestion[];
};

export const PROFILES: Record<string, UserProfile> = {
  'green-lantern': {
    id: 'green-lantern',
    name: 'Green Lantern',
    memberSince: '02 May 2021',
    avatarColor: '#2AB3A6',
    postCount: 4,
    followersCount: '3.2k',
    followingCount: 10,
    suggestions: [
      { id: 'bald-eagle', name: 'Bald Eagle', memberSince: '15 March 2018', color: '#8A6A2E' },
      { id: 'harpy-eagle', name: 'Harpy Eagle', memberSince: '22 July 2021', color: '#4A4A4A' },
      { id: 'steppe-eagle', name: 'Steppe Eagle', memberSince: '10 January 2020', color: '#2E5FB4' },
      { id: 'tawny-eagle', name: 'Tawny Eagle', memberSince: '05 June 2019', color: '#C79A3A' },
    ],
  },
};

export const CURRENT_USER_ID = 'green-lantern';
