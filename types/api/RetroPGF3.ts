export type ProjectAmount = {
  amount: string;
  currency: string;
  decimals: number;
};

export type ProjectApplicant = {
  address: {
    isContract: boolean;
    resolvedName: {
      address: string;
      name: string;
    };
    address: string;
  };
  amountOwned: {
    amount: ProjectAmount;
    bpsOfDelegatedSupply: number;
    bpsOfQuorum: number;
    bpsOfTotal: number;
  };
};

export type ProjectContributionLink = {
  description: string;
  type: string;
  url: string;
};

export type ProjectFundingSource = {
  amount: number;
  currency: string;
  description: string;
  type: string;
};

export type ProjectImpactMetric = {
  description: string;
  number: string;
  url: string;
};

export type ProjectProfile = {
  bannerImageUrl?: string;
  id: string;
  bio: string;
  name: string;
  profileImageUrl: string;
  uid: string;
  websiteUrl: string;
};

export type Project = {
  id: string;
  included_in_ballots: number;
  display_name: string;
  applicant: ProjectApplicant;
  applicant_type: string;
  bio: string;
  certified_not_barred_from_participating: boolean;
  certified_not_designated_or_sanctioned_or_blocked: boolean;
  certified_not_sponsored_by_political_figure_or_government_entit: boolean;
  contribution_description: string;
  contribution_links: ProjectContributionLink[];
  funding_sources: ProjectFundingSource[];
  impact_category: string[];
  impact_description: string;
  impact_metrics: ProjectImpactMetric[];
  lists: List[]; // Specify further if you have details about the lists structure
  understood_fund_claim_period: boolean;
  understood_kyc_requirements: boolean;
  website_url: string;
  profile: ProjectProfile;
  payout_address: {
    address: string;
  };
  note: string | null;
  has_token: boolean;
  value_raised: number | null;
  last_updated: string;
};

export type ProjectsResponse = {
  projects: Project[];
};

export type List = {
  id: string;
  listName: string;
  listDescription: string;
  author: ListAuthor;
  categories: string;
  impactEvaluationDescription: string;
  impactEvaluationLink: string;
  likes: string[];
  listContent?: ListContent[];
};

export type ListContent = {
  project: {
    id: string;
  };
  OPAmount: number;
};

export type ListAuthor = {
  address: string;
  isContract: boolean;
  resolvedName: {
    address: string;
    name: string;
  };
};

export type ListAmountsByProjectIdResponse = {
  listAmounts: ListAmountsByProjectId;
};

export type ListAmountsByProjectId = {
  [key: string]: {
    id: string;
    listName: string;
    listAuthor: ListAuthor;
    listContent: ListContent[];
  }[];
};

export type ProjectInfoResponse = {
  projectInfo: ProjectInfo[];
};

export type ProjectInfo = {
  project_id: string;
  value_raised: string;
  has_token: boolean;
  note: string;
};
