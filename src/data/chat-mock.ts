export type ChatMessage = {
  id: string;
  fromMe: boolean;
  text?: string;
  imageColor?: string;
  timestamp: string;
  read?: boolean;
};

export type Conversation = {
  id: string;
  name: string;
  username: string;
  avatarColor: string;
  lastMessagePreview: string;
  lastMessageIsImage?: boolean;
  lastMessageRead?: boolean;
  timestamp: string;
  unreadCount: number;
  isRequest: boolean;
  isBlocked: boolean;
  followersCount?: number;
  mutualFollow?: boolean;
  messages: ChatMessage[];
};

export const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'ethan-carter',
    name: 'Ethan Carter',
    username: '_ethancarter78',
    avatarColor: '#6A6A6A',
    lastMessagePreview: 'Just tried a new coffee place downtown. Have you been there?',
    lastMessageRead: false,
    timestamp: '4:00 PM',
    unreadCount: 0,
    isRequest: false,
    isBlocked: false,
    messages: [
      { id: 'ec-1', fromMe: true, text: "Hello there! How's your day going?", timestamp: '06:49 PM', read: true },
      { id: 'ec-2', fromMe: false, text: 'Hey! Just finished a great book. What about you?', timestamp: '06:49 PM' },
      { id: 'ec-3', fromMe: true, imageColor: '#2451B4', timestamp: '06:49 PM', read: true },
      { id: 'ec-4', fromMe: false, text: 'Just tried a new coffee place downtown. Have you been there?', timestamp: '06:49 PM' },
    ],
  },
  {
    id: 'sophia-lee',
    name: 'Sophia Lee',
    username: 'sophia._.lee',
    avatarColor: '#7B6FD6',
    lastMessagePreview: 'Hello!',
    lastMessageRead: true,
    timestamp: '4:15 PM',
    unreadCount: 0,
    isRequest: false,
    isBlocked: false,
    followersCount: 29,
    mutualFollow: true,
    messages: [],
  },
  {
    id: 'liam-smith',
    name: 'Liam Smith',
    username: 'liam.smith',
    avatarColor: '#8A6A4A',
    lastMessagePreview: 'Good afternoon!',
    timestamp: '4:30 PM',
    unreadCount: 2,
    isRequest: true,
    isBlocked: false,
    messages: [{ id: 'ls-1', fromMe: false, text: 'Good afternoon!', timestamp: '4:30 PM' }],
  },
  {
    id: 'olivia-johnson',
    name: 'Olivia Johnson',
    username: 'olivia.j',
    avatarColor: '#4A8A6A',
    lastMessagePreview: '2 images',
    lastMessageIsImage: true,
    timestamp: '4:45 PM',
    unreadCount: 0,
    isRequest: false,
    isBlocked: false,
    messages: [
      { id: 'oj-1', fromMe: false, imageColor: '#4A8A6A', timestamp: '4:45 PM' },
      { id: 'oj-2', fromMe: false, imageColor: '#6A8A4A', timestamp: '4:45 PM' },
    ],
  },
];

export type SuggestedUser = {
  id: string;
  name: string;
  memberSince: string;
  color: string;
};

export const SUGGESTED_USERS: SuggestedUser[] = [
  { id: 'blue-butterfly', name: 'Blue Butterfly', memberSince: '02 May 2021', color: '#2E5FB4' },
  { id: 'green-lantern', name: 'Green Lantern', memberSince: '15 June 2020', color: '#2AB3A6' },
  { id: 'red-fox', name: 'Red Fox', memberSince: '24 August 2022', color: '#B4442E' },
  { id: 'golden-eagle', name: 'Golden Eagle', memberSince: '30 November 2019', color: '#C79A3A' },
  { id: 'black-panther', name: 'Black Panther', memberSince: '05 January 2023', color: '#3A3A3A' },
  { id: 'white-tiger', name: 'White Tiger', memberSince: '12 March 2021', color: '#7B3FF2' },
];

export type ForwardContact = {
  id: string;
  name: string;
  username: string;
  color: string;
};

export const FORWARD_CONTACTS: ForwardContact[] = [
  { id: 'liam', name: 'Liam', username: 'luna.starlight', color: '#2E5FB4' },
  { id: 'mia', name: 'Mia Rodriguez', username: 'james.bond007', color: '#B4442E' },
  { id: 'noah', name: 'Noah', username: 'max.power', color: '#4A4A4A' },
  { id: 'ava', name: 'Ava Smith', username: 'sandy.beach', color: '#C79A3A' },
  { id: 'ollie', name: 'Ollie', username: 'chris.pineapple', color: '#2AB3A6' },
  { id: 'soph', name: 'Soph', username: 'nina.sparks', color: '#7B3FF2' },
  { id: 'luke', name: 'Luke', username: 'harry.potterfan', color: '#8A6A4A' },
  { id: 'bella', name: 'Bella', username: 'zoe.brightside', color: '#E0637C' },
  { id: 'elijah', name: 'Elijah', username: 'mike.wander', color: '#3A5A8A' },
  { id: 'charlie', name: 'Charlie', username: 'ella.dreamer', color: '#8A4A2E' },
  { id: 'james', name: 'James', username: 'leo.tigerpaw', color: '#4A8A6A' },
];

export const REPORT_REASONS = [
  'Spam',
  'Harassment or Bullying',
  'Hate Speech',
  'Inappropriate Content',
  'Scam or Fraud',
  'Impersonation',
  'Threats or Violence',
  'Other',
] as const;
