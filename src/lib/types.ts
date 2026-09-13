export interface ZhihuSearchItem {
  Title: string;
  ContentType: string;
  ContentID: string;
  ContentText: string;
  Url: string;
  CommentCount: number;
  VoteUpCount: number;
  AuthorName: string;
  AuthorAvatar: string;
  AuthorBadge: string;
  AuthorBadgeText: string;
  EditTime: number;
  AuthorityLevel: string;
}

export interface Candidate {
  contentId: string;
  title: string;
  contentText: string;
  url: string;
  authorName: string;
  authorAvatar: string;
  authorBadgeText: string;
  voteUpCount: number;
  commentCount: number;
}

export interface DiscoverRequest {
  situation: string;
}

export interface DiscoverResponse {
  query: string;
  candidates: Candidate[];
  notFound: boolean;
  emptyReason?: string;
}

export interface IcebreakerRequest {
  candidate: Candidate;
  situation: string;
}

export interface IcebreakerResponse {
  message: string;
}

export interface SessionStatus {
  connected: boolean;
  expiresAt?: number;
  user?: {
    name?: string;
    avatarUrl?: string;
  };
}
