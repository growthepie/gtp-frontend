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
  includedInBallots: number;
  displayName: string;
  applicant: ProjectApplicant;
  applicantType: string;
  bio: string;
  certifiedNotBarredFromParticipating: boolean;
  certifiedNotDesignatedOrSanctionedOrBlocked: boolean;
  certifiedNotSponsoredByPoliticalFigureOrGovernmentEntity: boolean;
  contributionDescription: string;
  contributionLinks: ProjectContributionLink[];
  fundingSources: ProjectFundingSource[];
  impactCategory: string[];
  impactDescription: string;
  impactMetrics: ProjectImpactMetric[];
  lists: any[]; // Specify further if you have details about the lists structure
  understoodFundClaimPeriod: boolean;
  understoodKYCRequirements: boolean;
  websiteUrl: string;
  profile: ProjectProfile;
  payoutAddress: {
    address: string;
    isContract: boolean;
    resolvedName: {
      address: string;
      name: string;
    };
  };
};

export type ProjectsResponse = {
  projects: Project[];
};
