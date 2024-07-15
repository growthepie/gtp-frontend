/* eslint-disable */
/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface SyncStatus {
  /** Current Epoch number per blockchain state */
  blockchainEpoch: number;
  /** Current Epoch number according to indexer */
  indexedEpoch: number;
  /** Current block/slot number per blockchain */
  blockchainHeight: number;
  /** Current block/slot number according to indexer */
  indexedHeight: number;
  /** State of pending epoch snapshot (not_applicable, error, in_progress, done) */
  pendingSnapshot: string;
  /** State of finalized epoch snapshot (not_applicable, error, too_early, in_progress, done) */
  finalizedSnapshot: string;
}

export interface ChainInfo {
  /** The chain name. */
  chainName?: string;
  /** The chain id. */
  chainId?: string;
  /** The smart contracts used by Octant in given network. */
  smartContracts?: SmartContract[];
}

export interface SmartContract {
  /** The smart contract name. */
  name?: string;
  /** The smart contract address. */
  address?: string;
}

export interface AppVersion {
  /** deployment identifier */
  id?: string;
  /** deployment environment */
  env?: string;
  /** blockchain name */
  chain?: string;
}

export interface Healthcheck {
  /** UP if blockchain RPC is responsive, DOWN otherwise */
  blockchain?: string;
  /** UP if db is responsive, DOWN otherwise */
  db?: string;
  /** UP if subgraph is responsive, DOWN otherwise */
  subgraph?: string;
}

export interface UserHistory {
  /** History of user actions */
  history?: HistoryItem[];
  /** Next page cursor */
  nextCursor?: string;
}

export interface HistoryItem {
  /** Type of action (lock, unlock, allocation, withdrawal, patron_mode_donation) */
  type: string;
  /** Timestamp in seconds when the action occurred (since Unix epoch) */
  timestamp: string;
  /** History event data */
  eventData: HistoryItemData;
}

export interface HistoryItemData {
  /** Amount involved in the action, BigNumber (wei) */
  amount: string;
  /** Hash of the transaction corresponding to the history item. Field available for locks, unlocks and withdrawals. */
  transactionHash?: string;
  /** Epoch in which action occured. Field available only for patron_mode_donation items.  */
  epoch?: number;
  /** Whether has the allocation been manually edited by the user. Field available only for allocation items. */
  isManuallyEdited?: boolean;
  /** Leverage of the allocated funds. Field available only for allocation items. */
  leverage?: string;
  /** Project allocation items. Field available only for allocation items. */
  allocations?: ProjectAllocationItem[];
}

export interface ProjectAllocationItem {
  /** Allocation project address. */
  projectAddress: string;
  /** Amount donated to a project, BigNumber (wei) */
  amount: string;
}

export interface EpochStatus {
  /** Returns True if the given epoch is the current epoch */
  isCurrent: boolean;
  /** Returns True if the given epoch is the pending epoch */
  isPending: boolean;
  /** Returns True if the given epoch is a finalized epoch */
  isFinalized: boolean;
}

export interface FinalizedSnapshotModel {
  patronsRewards?: string;
  matchedRewards?: string;
  projectsRewards?: ProjectRewardModel[];
  userRewards?: UserRewardModel[];
  totalWithdrawals?: string;
  leftover?: string;
  merkleRoot?: string;
}

export interface ProjectRewardModel {
  address?: string;
  amount?: string;
  matched?: string;
}

export interface UserRewardModel {
  address?: string;
  amount?: string;
}

export interface PendingSnapshotModel {
  rewards?: OctantRewardsModel;
  userDeposits?: UserDepositsModel[];
  userBudgets?: UserBudgetsInfoModel[];
}

export interface OctantRewardsModel {
  stakingProceeds?: string;
  lockedRatio?: string;
  totalEffectiveDeposit?: string;
  totalRewards?: string;
  vanillaIndividualRewards?: string;
  operationalCost?: string;
  communityFund?: string;
  ppf?: string;
}

export interface UserDepositsModel {
  userAddress?: string;
  effectiveDeposit?: string;
  deposit?: string;
}

export interface UserBudgetsInfoModel {
  userAddress?: string;
  budget?: string;
}

export interface UserBudget {
  /** User budget for given epoch, BigNumber (wei) */
  budget: string;
}

export interface EpochBudgets {
  /** Users budgets for given epoch, BigNumber (wei) */
  budgets: EpochBudgetItem[];
}

export interface EpochBudgetItem {
  /** User address */
  address: string;
  /** User budget for given epoch, BigNumber (wei) */
  amount: string;
}

export interface EstimatedBudget {
  /** Number of epochs when GLM are locked */
  numberOfEpochs: number;
  /** Amount of estimated GLM locked in WEI */
  glmAmount: string;
}

export interface EstimatedBudgetByDays {
  /** Number of days when GLM are locked */
  days: number;
  /** Amount of estimated GLM locked in WEI */
  glmAmount: string;
}

export interface Threshold {
  /** Threshold, that projects have to pass to be eligible for receiving rewards */
  threshold: string;
}

export interface ProjectRewards {
  /** Project rewards */
  rewards: Project[];
}

export interface Project {
  /** Project address */
  address: string;
  /** Matched rewards funds for the project, wei */
  value: string;
}

export interface UnusedRewards {
  /** Users that neither allocated rewards nor toggled patron mode */
  addresses: string[];
  /** Total unused rewards sum in an epoch (WEI) */
  value: string;
}

export interface Leverage {
  /** Leverage of the allocated funds */
  leverage: number;
}

export interface EpochRewardsMerkleTree {
  /** Epoch number */
  epoch: number;
  /** Sum of assigned rewards for epoch */
  rewardsSum: string;
  /** Merkle Tree root for epoch */
  root: string;
  /** List of Merkle Tree leaves */
  leaves: EpochRewardsMerkleTreeLeaf[];
  /** Merkle tree leaf encoding */
  leafEncoding: string[];
}

export interface EpochRewardsMerkleTreeLeaf {
  /** User account or project address */
  address: string;
  /** Assigned reward */
  amount: string;
}

export interface UpcomingBudgetResponse {
  /** Calculated upcoming user budget. */
  upcomingBudget: string;
}

export interface TotalEffective {
  /** total effective deposit in given epoch */
  totalEffective: string;
}

export interface LockedRatio {
  /** GLM locked ratio in given epoch */
  lockedRatio: string;
}

export interface EffectiveDeposit {
  /** Effective GLM deposit, in wei */
  effectiveDeposit: string;
}

export interface WithdrawableRewards {
  /** Epoch number */
  epoch: number;
  /** User withdrawable rewards in a particular epoch */
  amount: string;
  /** List of merkle proofs needed to withdraw funds from smart contract */
  proof: string[];
  /** User withdrawable rewards status (pending, available) */
  status: string;
}

export interface UserAllocationRequest {
  payload?: AllocationPayload;
  /** Wallet address of the user. EOA or EIP-1271 */
  userAddress: string;
  /** EIP-712 signature of the allocation payload as a hexadecimal string */
  signature: string;
  /** Whether allocation was manually edited by user. */
  isManuallyEdited?: boolean;
}

export interface AllocationPayload {
  /** User allocation payload */
  allocations?: UserAllocationPayloadItem[];
  /** Allocation signature nonce */
  nonce: number;
}

export interface UserAllocationPayloadItem {
  /** Project address */
  proposalAddress: string;
  /** Funds allocated by user for the project in WEI */
  amount: string;
}

export interface LeveragePayload {
  /** User allocation payload */
  allocations?: UserAllocationPayloadItem[];
}

export interface UserLeverage {
  /** Leverage of the allocated funds */
  leverage: string;
  /** Simulated threshold, above which projects get funded. */
  threshold: string;
  /** List of matched rewards for each project */
  matched: Project[];
}

export interface AllocationsModel {
  allocations?: EpochAllocation[];
}

export interface EpochAllocation {
  /** Donor address */
  donor: string;
  /** Funds allocated by donor for the project in WEI */
  amount: string;
  /** Project address */
  project: string;
}

export interface UserAllocations {
  /** User allocation item */
  allocations?: UserAllocationItem[];
  /** Whether allocation was manually edited by user. */
  isManuallyEdited?: boolean;
}

export interface UserAllocationItem {
  /** Project address */
  address: string;
  /** Funds allocated by user for the project in WEI */
  amount: string;
}

export interface ProjectDonors {
  /** Donor address */
  address: string;
  /** Funds allocated by donor for the project in WEI */
  amount: string;
}

export interface AllocationNonce {
  /** Current value of nonce used to sign allocations message. Note: this has nothing to do with Ethereum account nonce! */
  allocationNonce: number;
}

export interface Donors {
  /** Donors address */
  donors: string[];
}

export interface ClaimGLMRequest {
  /** EIP-712 signature of a payload with the following message: {"msg": "Claim <AMOUNT-TO-CLAIM-IN-ETHER> GLMs"} as a hexadecimal string */
  signature: string;
}

export interface CheckClaim {
  /** Address of the user */
  address: string;
  /** Amount of GLMs that can be claimed, in WEI */
  claimable: string;
}

export interface CurrentEpoch {
  /** Current epoch number */
  currentEpoch: number;
}

export interface IndexedEpoch {
  /** Current epoch number */
  currentEpoch: number;
  /** Indexed epoch number */
  indexedEpoch: number;
}

export interface EpochStats {
  /** ETH proceeds from staking for the given epoch. */
  stakingProceeds: string;
  /** Effectively locked GLMs for the given epoch */
  totalEffectiveDeposit: string;
  /** Total rewards for the given epoch. */
  totalRewards: string;
  /** Total rewards budget allocated to users rewards */
  vanillaIndividualRewards: string;
  /** The amount needed to cover the Octant's costs */
  operationalCost: string;
  /** Rewards users decided to withdraw for the given epoch. */
  totalWithdrawals?: string;
  /** Matching fund budget coming from patrons. */
  patronsRewards?: string;
  /**
   * Total matched rewards for the given epoch.
   *             Includes matchedRewards from Golem Foundation and patronRewards.
   */
  matchedRewards?: string;
  /** The amount that will be used to increase staking and for other Octant related operations. Includes donations to projects that didn't reach the threshold. */
  leftover?: string;
  /** PPF for the given epoch. It's calculated based on substracting Vanillia Individual Rewards from Individual Rewards Equilibrium. */
  ppf?: string;
  /** Community fund for the given epoch. It's calculated from staking proceeds directly. */
  communityFund?: string;
}

export interface TermsOfServiceConsentStatus {
  /** Flag indicating whether user has already accepted Terms of Service */
  accepted: boolean;
}

export interface PatronModeRequest {
  /** signature of the patron mode status message as a hexadecimal string */
  signature: string;
}

export interface PatronModeStatus {
  /** Flag indicating whether user has enabled patron mode */
  status: boolean;
}

export interface UserAntisybilStatus {
  /** Unknown or Known */
  status: string;
  /** Expiry date, unix timestamp */
  expires_at?: string;
  /** Score, parses as a float */
  score?: string;
}

export interface Patrons {
  /** Patrons address */
  patrons: string[];
}

export interface UQScore {
  /** Uniqueness quotient score */
  uniquenessQuotient: string;
}

export interface ActiveValidatorsSummary {
  /** The amount of active Octant validators. */
  activeValidatorsNumber: number;
  /** The sum of effective balances of all active Octant validators in gwei. */
  ethEffectiveBalance: string;
}

export interface PendingSignature {
  /** The message to be signed. */
  message?: string;
  /** The hash of the message. */
  hash?: string;
}

export interface ProjectsMetadata {
  /** Projects addresses */
  projectsAddresses: string[];
  /** Projects CID */
  projectsCid: string;
}

export interface Delegation {
  /** User primary ethereum address in hexadecimal form (case-insensitive, prefixed with 0x) */
  primaryAddr: string;
  /** User secondary ethereum address in hexadecimal form (case-insensitive, prefixed with 0x) */
  secondaryAddr: string;
  /** Primary address signature of the message: Delegation of UQ score from {secondary_addr} to {primary_addr} */
  primaryAddrSignature: string;
  /** Secondary address signature of the message: Delegation of UQ score from {secondary_addr} to {primary_addr} */
  secondaryAddrSignature: string;
}

export interface ScoreDelegationCheckResult {
  /** Address that receives delegated score */
  primary?: string;
  /** Address that donates delegated score */
  secondary?: string;
}

export type QueryParamsType = Record<string | number, any>;
export type ResponseFormat = keyof Omit<Body, "body" | "bodyUsed">;

export interface FullRequestParams extends Omit<RequestInit, "body"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseFormat;
  /** request body */
  body?: unknown;
  /** base url */
  baseUrl?: string;
  /** request cancellation token */
  cancelToken?: CancelToken;
}

export type RequestParams = Omit<FullRequestParams, "body" | "method" | "query" | "path">;

export interface ApiConfig<SecurityDataType = unknown> {
  baseUrl?: string;
  baseApiParams?: Omit<RequestParams, "baseUrl" | "cancelToken" | "signal">;
  securityWorker?: (securityData: SecurityDataType | null) => Promise<RequestParams | void> | RequestParams | void;
  customFetch?: typeof fetch;
}

export interface HttpResponse<D extends unknown, E extends unknown = unknown> extends Response {
  data: D;
  error: E;
}

type CancelToken = Symbol | string | number;

export enum ContentType {
  Json = "application/json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public baseUrl: string = "/";
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private abortControllers = new Map<CancelToken, AbortController>();
  private customFetch = (...fetchParams: Parameters<typeof fetch>) => fetch(...fetchParams);

  private baseApiParams: RequestParams = {
    credentials: "same-origin",
    headers: {},
    redirect: "follow",
    referrerPolicy: "no-referrer",
  };

  constructor(apiConfig: ApiConfig<SecurityDataType> = {}) {
    Object.assign(this, apiConfig);
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected encodeQueryParam(key: string, value: any) {
    const encodedKey = encodeURIComponent(key);
    return `${encodedKey}=${encodeURIComponent(typeof value === "number" ? value : `${value}`)}`;
  }

  protected addQueryParam(query: QueryParamsType, key: string) {
    return this.encodeQueryParam(key, query[key]);
  }

  protected addArrayQueryParam(query: QueryParamsType, key: string) {
    const value = query[key];
    return value.map((v: any) => this.encodeQueryParam(key, v)).join("&");
  }

  protected toQueryString(rawQuery?: QueryParamsType): string {
    const query = rawQuery || {};
    const keys = Object.keys(query).filter((key) => "undefined" !== typeof query[key]);
    return keys
      .map((key) => (Array.isArray(query[key]) ? this.addArrayQueryParam(query, key) : this.addQueryParam(query, key)))
      .join("&");
  }

  protected addQueryParams(rawQuery?: QueryParamsType): string {
    const queryString = this.toQueryString(rawQuery);
    return queryString ? `?${queryString}` : "";
  }

  private contentFormatters: Record<ContentType, (input: any) => any> = {
    [ContentType.Json]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string") ? JSON.stringify(input) : input,
    [ContentType.Text]: (input: any) => (input !== null && typeof input !== "string" ? JSON.stringify(input) : input),
    [ContentType.FormData]: (input: FormData) =>
      (Array.from(input.keys()) || []).reduce((formData, key) => {
        const property = input.get(key);
        formData.append(
          key,
          property instanceof Blob
            ? property
            : typeof property === "object" && property !== null
              ? JSON.stringify(property)
              : `${property}`,
        );
        return formData;
      }, new FormData()),
    [ContentType.UrlEncoded]: (input: any) => this.toQueryString(input),
  };

  protected mergeRequestParams(params1: RequestParams, params2?: RequestParams): RequestParams {
    return {
      ...this.baseApiParams,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...(this.baseApiParams.headers || {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected createAbortSignal = (cancelToken: CancelToken): AbortSignal | undefined => {
    if (this.abortControllers.has(cancelToken)) {
      const abortController = this.abortControllers.get(cancelToken);
      if (abortController) {
        return abortController.signal;
      }
      return void 0;
    }

    const abortController = new AbortController();
    this.abortControllers.set(cancelToken, abortController);
    return abortController.signal;
  };

  public abortRequest = (cancelToken: CancelToken) => {
    const abortController = this.abortControllers.get(cancelToken);

    if (abortController) {
      abortController.abort();
      this.abortControllers.delete(cancelToken);
    }
  };

  public request = async <T = any, E = any>({
    body,
    secure,
    path,
    type,
    query,
    format,
    baseUrl,
    cancelToken,
    ...params
  }: FullRequestParams): Promise<HttpResponse<T, E>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.baseApiParams.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const queryString = query && this.toQueryString(query);
    const payloadFormatter = this.contentFormatters[type || ContentType.Json];
    const responseFormat = format || requestParams.format;

    return this.customFetch(`${baseUrl || this.baseUrl || ""}${path}${queryString ? `?${queryString}` : ""}`, {
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type && type !== ContentType.FormData ? { "Content-Type": type } : {}),
      },
      signal: (cancelToken ? this.createAbortSignal(cancelToken) : requestParams.signal) || null,
      body: typeof body === "undefined" || body === null ? null : payloadFormatter(body),
    }).then(async (response) => {
      const r = response.clone() as HttpResponse<T, E>;
      r.data = null as unknown as T;
      r.error = null as unknown as E;

      const data = !responseFormat
        ? r
        : await response[responseFormat]()
            .then((data) => {
              if (r.ok) {
                r.data = data;
              } else {
                r.error = data;
              }
              return r;
            })
            .catch((e) => {
              r.error = e;
              return r;
            });

      if (cancelToken) {
        this.abortControllers.delete(cancelToken);
      }

      if (!response.ok) throw data;
      return data;
    });
  };
}

/**
 * @title Octant API
 * @version 1.0.0
 * @baseUrl /
 *
 * Octant REST API documentation
 */
export class OctantClient<SecurityDataType extends unknown> extends HttpClient<SecurityDataType> {
  allocations = {
    /**
     * @description Allocates user's funds to projects
     *
     * @tags allocations
     * @name PostAllocation
     * @request POST:/allocations/allocate
     */
    postAllocation: (payload: UserAllocationRequest, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/allocations/allocate`,
        method: "POST",
        body: payload,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Returns donors addresses
     *
     * @tags allocations
     * @name GetDonors
     * @request GET:/allocations/donors/{epoch}
     */
    getDonors: (epoch: number, params: RequestParams = {}) =>
      this.request<Donors, any>({
        path: `/allocations/donors/${epoch}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Returns all latest allocations in a particular epoch
     *
     * @tags allocations
     * @name GetEpochAllocations
     * @request GET:/allocations/epoch/{epoch}
     */
    getEpochAllocations: (
      epoch: number,
      query?: {
        /** Include zero allocations to projects. Defaults to false. */
        includeZeroAllocations?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<AllocationsModel, any>({
        path: `/allocations/epoch/${epoch}`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description Simulates an allocation and get the expected leverage
     *
     * @tags allocations
     * @name PostAllocationLeverage
     * @request POST:/allocations/leverage/{user_address}
     */
    postAllocationLeverage: (userAddress: string, payload: LeveragePayload, params: RequestParams = {}) =>
      this.request<UserLeverage, any>({
        path: `/allocations/leverage/${userAddress}`,
        method: "POST",
        body: payload,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Returns list of donors for given project in particular epoch
     *
     * @tags allocations
     * @name GetProjectDonors
     * @request GET:/allocations/project/{project_address}/epoch/{epoch}
     */
    getProjectDonors: (projectAddress: string, epoch: number, params: RequestParams = {}) =>
      this.request<ProjectDonors, any>({
        path: `/allocations/project/${projectAddress}/epoch/${epoch}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Returns user's latest allocation in a particular epoch
     *
     * @tags allocations
     * @name GetUserAllocations
     * @request GET:/allocations/user/{user_address}/epoch/{epoch}
     */
    getUserAllocations: (userAddress: string, epoch: number, params: RequestParams = {}) =>
      this.request<UserAllocations, any>({
        path: `/allocations/user/${userAddress}/epoch/${epoch}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Return current value of allocation nonce. It is needed to sign allocations.
     *
     * @tags allocations
     * @name GetAllocationNonce
     * @request GET:/allocations/users/{user_address}/allocation_nonce
     */
    getAllocationNonce: (userAddress: string, params: RequestParams = {}) =>
      this.request<AllocationNonce, any>({
        path: `/allocations/users/${userAddress}/allocation_nonce`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  delegation = {
    /**
     * @description Allows wallet to check if its accounts are delegating to each other. Implementation of this feature relies on a fact that Ethereum has > 250mil addresses, so blind enumeration is hard. We intend to replace it with proper zk-based delegation as soon as possible
     *
     * @tags delegation
     * @name GetUqScoreDelegationCheck
     * @request GET:/delegation/check/{addresses}
     */
    getUqScoreDelegationCheck: (addresses: string, params: RequestParams = {}) =>
      this.request<ScoreDelegationCheckResult, any>({
        path: `/delegation/check/${addresses}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Delegates UQ score from secondary address to primary address
     *
     * @tags delegation
     * @name PostUqScoreDelegation
     * @request POST:/delegation/delegate
     */
    postUqScoreDelegation: (payload: Delegation, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/delegation/delegate`,
        method: "POST",
        body: payload,
        ...params,
      }),

    /**
     * @description Recalculates UQ score from secondary address to primary address
     *
     * @tags delegation
     * @name PutUqScoreRecalculation
     * @request PUT:/delegation/recalculate
     */
    putUqScoreRecalculation: (payload: Delegation, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/delegation/recalculate`,
        method: "PUT",
        body: payload,
        ...params,
      }),
  };
  deposits = {
    /**
     * @description Returns value of estimated total effective deposits for current epoch.
     *
     * @tags deposits
     * @name GetEstimatedTotalEffectiveDeposit
     * @request GET:/deposits/total_effective/estimated
     */
    getEstimatedTotalEffectiveDeposit: (params: RequestParams = {}) =>
      this.request<TotalEffective, any>({
        path: `/deposits/total_effective/estimated`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Returns user's estimated effective deposit for the current epoch.
     *
     * @tags deposits
     * @name GetUserEstimatedEffectiveDeposit
     * @request GET:/deposits/users/{user_address}/estimated_effective_deposit
     */
    getUserEstimatedEffectiveDeposit: (userAddress: string, params: RequestParams = {}) =>
      this.request<EffectiveDeposit, any>({
        path: `/deposits/users/${userAddress}/estimated_effective_deposit`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Returns user's effective deposit for a finialized or pending epoch.
     *
     * @tags deposits
     * @name GetUserEffectiveDeposit
     * @request GET:/deposits/users/{user_address}/{epoch}
     */
    getUserEffectiveDeposit: (epoch: number, userAddress: string, params: RequestParams = {}) =>
      this.request<EffectiveDeposit, any>({
        path: `/deposits/users/${userAddress}/${epoch}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Returns locked ratio of total effective deposits made by the end of an epoch. Latest data and data for any given point in time from the past is available in the Subgraph.
     *
     * @tags deposits
     * @name GetLockedRatio
     * @request GET:/deposits/{epoch}/locked_ratio
     */
    getLockedRatio: (epoch: number, params: RequestParams = {}) =>
      this.request<LockedRatio, any>({
        path: `/deposits/${epoch}/locked_ratio`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Returns value of total effective deposits made by the end of an epoch. Latest data and data for any given point in time from the past is available in the Subgraph.
     *
     * @tags deposits
     * @name GetTotalEffectiveDeposit
     * @request GET:/deposits/{epoch}/total_effective
     */
    getTotalEffectiveDeposit: (epoch: number, params: RequestParams = {}) =>
      this.request<TotalEffective, any>({
        path: `/deposits/${epoch}/total_effective`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  epochs = {
    /**
     * @description Returns current epoch number
     *
     * @tags epochs
     * @name GetCurrentEpoch
     * @request GET:/epochs/current
     */
    getCurrentEpoch: (params: RequestParams = {}) =>
      this.request<CurrentEpoch, any>({
        path: `/epochs/current`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Returns last indexed epoch number
     *
     * @tags epochs
     * @name GetIndexedEpoch
     * @request GET:/epochs/indexed
     */
    getIndexedEpoch: (params: RequestParams = {}) =>
      this.request<IndexedEpoch, any>({
        path: `/epochs/indexed`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Returns statistics on a given epoch. Returns data only for historic and currently pending epochs.
     *
     * @tags epochs
     * @name GetEpochStats
     * @request GET:/epochs/info/{epoch}
     */
    getEpochStats: (epoch: number, params: RequestParams = {}) =>
      this.request<EpochStats, void>({
        path: `/epochs/info/${epoch}`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  faviconIco = {
    /**
     * No description
     *
     * @tags default
     * @name GetFavicon
     * @request GET:/favicon.ico
     */
    getFavicon: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/favicon.ico`,
        method: "GET",
        ...params,
      }),
  };
  glm = {
    /**
     * @description Claim GLMs from epoch 0. Only eligible accounts are able to claim.
     *
     * @tags glm
     * @name PostClaim
     * @request POST:/glm/claim
     */
    postClaim: (payload: ClaimGLMRequest, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/glm/claim`,
        method: "POST",
        body: payload,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Check if account is eligible are able to claim GLMs from epoch 0. Return number of GLMs in wei
     *
     * @tags glm
     * @name GetCheckClaim
     * @request GET:/glm/claim/{user_address}/check
     */
    getCheckClaim: (userAddress: string, params: RequestParams = {}) =>
      this.request<CheckClaim, void>({
        path: `/glm/claim/${userAddress}/check`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  history = {
    /**
     * No description
     *
     * @tags history
     * @name GetHistory
     * @request GET:/history/{user_address}
     */
    getHistory: (
      userAddress: string,
      query?: {
        /** History page size */
        limit?: string;
        /** History page cursor */
        cursor?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<UserHistory, any>({
        path: `/history/${userAddress}`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),
  };
  info = {
    /**
     * @description Info about the blockchain network and smart contracts
     *
     * @tags info
     * @name GetChainInfo
     * @request GET:/info/chain-info
     */
    getChainInfo: (params: RequestParams = {}) =>
      this.request<ChainInfo, any>({
        path: `/info/chain-info`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Application healthcheck endpoint
     *
     * @tags info
     * @name GetHealthcheck
     * @request GET:/info/healthcheck
     */
    getHealthcheck: (params: RequestParams = {}) =>
      this.request<Healthcheck, void>({
        path: `/info/healthcheck`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Returns synchronization status for indexer and database
     *
     * @tags info
     * @name GetIndexedEpoch
     * @request GET:/info/sync-status
     */
    getIndexedEpoch: (params: RequestParams = {}) =>
      this.request<SyncStatus, any>({
        path: `/info/sync-status`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Application deployment information
     *
     * @tags info
     * @name GetVersion
     * @request GET:/info/version
     */
    getVersion: (params: RequestParams = {}) =>
      this.request<AppVersion, any>({
        path: `/info/version`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description The documentation for websockets can be found under this path
     *
     * @tags info
     * @name GetWebsocketsDocs
     * @request GET:/info/websockets-api
     */
    getWebsocketsDocs: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/info/websockets-api`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags info
     * @name GetWebsocketsDocsYaml
     * @request GET:/info/websockets-api.yaml
     */
    getWebsocketsDocsYaml: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/info/websockets-api.yaml`,
        method: "GET",
        ...params,
      }),
  };
  multisigSignatures = {
    /**
     * @description Approve pending multisig messages.
     *
     * @tags multisig-signatures
     * @name PatchMultisigApprovePending
     * @request PATCH:/multisig-signatures/pending/approve
     */
    patchMultisigApprovePending: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/multisig-signatures/pending/approve`,
        method: "PATCH",
        ...params,
      }),

    /**
     * No description
     *
     * @tags multisig-signatures
     * @name PostMultisigPendingSignature
     * @request POST:/multisig-signatures/pending/{user_address}/type/{op_type}
     */
    postMultisigPendingSignature: (
      userAddress: string,
      opType: string,
      payload: {
        message?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/multisig-signatures/pending/${userAddress}/type/${opType}`,
        method: "POST",
        body: payload,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Retrieve last pending multisig signature for a specific user and type.
     *
     * @tags multisig-signatures
     * @name GetMultisigPendingSignature
     * @request GET:/multisig-signatures/pending/{user_address}/type/{op_type}
     */
    getMultisigPendingSignature: (userAddress: string, opType: string, params: RequestParams = {}) =>
      this.request<PendingSignature, any>({
        path: `/multisig-signatures/pending/${userAddress}/type/${opType}`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  projects = {
    /**
     * @description Returns projects metadata for a given epoch: addresses and CID
     *
     * @tags projects
     * @name GetProjectsMetadata
     * @request GET:/projects/epoch/{epoch}
     */
    getProjectsMetadata: (epoch: number, params: RequestParams = {}) =>
      this.request<ProjectsMetadata, any>({
        path: `/projects/epoch/${epoch}`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  rewards = {
    /**
     * @description Returns user's rewards budget available to allocate for given epoch
     *
     * @tags rewards
     * @name GetUserBudget
     * @request GET:/rewards/budget/{user_address}/epoch/{epoch}
     */
    getUserBudget: (userAddress: string, epoch: number, params: RequestParams = {}) =>
      this.request<UserBudget, any>({
        path: `/rewards/budget/${userAddress}/epoch/${epoch}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Returns upcoming user budget based on if allocation happened now.
     *
     * @tags rewards
     * @name GetUpcomingUserBudget
     * @request GET:/rewards/budget/{user_address}/upcoming
     */
    getUpcomingUserBudget: (userAddress: string, params: RequestParams = {}) =>
      this.request<UpcomingBudgetResponse, any>({
        path: `/rewards/budget/${userAddress}/upcoming`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Returns all users rewards budgets for the epoch.
     *
     * @tags rewards
     * @name GetEpochBudgets
     * @request GET:/rewards/budgets/epoch/{epoch}
     */
    getEpochBudgets: (epoch: number, params: RequestParams = {}) =>
      this.request<EpochBudgets, void>({
        path: `/rewards/budgets/epoch/${epoch}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Returns estimated rewards budget available when GLM locked by given number of full epochs
     *
     * @tags rewards
     * @name PostEstimatedUserBudget
     * @request POST:/rewards/estimated_budget
     */
    postEstimatedUserBudget: (payload: EstimatedBudget, params: RequestParams = {}) =>
      this.request<UserBudget, any>({
        path: `/rewards/estimated_budget`,
        method: "POST",
        body: payload,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Returns estimated rewards budget available when GLM locked by given period of time
     *
     * @tags rewards
     * @name PostEstimatedUserBudgetByDays
     * @request POST:/rewards/estimated_budget/by_days
     */
    postEstimatedUserBudgetByDays: (payload: EstimatedBudgetByDays, params: RequestParams = {}) =>
      this.request<UserBudget, any>({
        path: `/rewards/estimated_budget/by_days`,
        method: "POST",
        body: payload,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Returns leverage in given epoch
     *
     * @tags rewards
     * @name GetLeverage
     * @request GET:/rewards/leverage/{epoch}
     */
    getLeverage: (epoch: number, params: RequestParams = {}) =>
      this.request<Leverage, any>({
        path: `/rewards/leverage/${epoch}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Returns merkle tree leaves with rewards for a given epoch
     *
     * @tags rewards
     * @name GetRewardsMerkleTree
     * @request GET:/rewards/merkle_tree/{epoch}
     */
    getRewardsMerkleTree: (epoch: number, params: RequestParams = {}) =>
      this.request<EpochRewardsMerkleTree, void>({
        path: `/rewards/merkle_tree/${epoch}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Returns projects with matched rewards for a given epoch
     *
     * @tags rewards
     * @name GetFinalizedProjectsRewards
     * @request GET:/rewards/projects/epoch/{epoch}
     */
    getFinalizedProjectsRewards: (epoch: number, params: RequestParams = {}) =>
      this.request<ProjectRewards, void>({
        path: `/rewards/projects/epoch/${epoch}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Returns project rewards with estimated matched rewards for the pending epoch
     *
     * @tags rewards
     * @name GetEstimatedProjectRewards
     * @request GET:/rewards/projects/estimated
     */
    getEstimatedProjectRewards: (params: RequestParams = {}) =>
      this.request<ProjectRewards, any>({
        path: `/rewards/projects/estimated`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Returns allocation threshold for the projects to be eligible for rewards
     *
     * @tags rewards
     * @name GetThreshold
     * @request GET:/rewards/threshold/{epoch}
     */
    getThreshold: (epoch: number, params: RequestParams = {}) =>
      this.request<Threshold, void>({
        path: `/rewards/threshold/${epoch}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Returns unallocated value and the number of users who didn't use their rewards in an epoch
     *
     * @tags rewards
     * @name GetUnusedRewards
     * @request GET:/rewards/unused/{epoch}
     */
    getUnusedRewards: (epoch: number, params: RequestParams = {}) =>
      this.request<UnusedRewards, any>({
        path: `/rewards/unused/${epoch}`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  snapshots = {
    /**
     * @description Take a database snapshot of the recently completed allocations.         This endpoint should be executed at the end of the decision window
     *
     * @tags snapshots
     * @name PostFinalizedEpochSnapshot
     * @request POST:/snapshots/finalized
     */
    postFinalizedEpochSnapshot: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/snapshots/finalized`,
        method: "POST",
        ...params,
      }),

    /**
     * @description Simulates the finalized snapshot
     *
     * @tags snapshots
     * @name GetSimulateFinalizedSnapshot
     * @request GET:/snapshots/finalized/simulate
     */
    getSimulateFinalizedSnapshot: (params: RequestParams = {}) =>
      this.request<FinalizedSnapshotModel, any>({
        path: `/snapshots/finalized/simulate`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Take a database snapshot of the recently completed epoch.         This endpoint should be executed at the beginning of an epoch to activate         a decision window.
     *
     * @tags snapshots
     * @name PostPendingEpochSnapshot
     * @request POST:/snapshots/pending
     */
    postPendingEpochSnapshot: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/snapshots/pending`,
        method: "POST",
        ...params,
      }),

    /**
     * @description Simulates the pending snapshot
     *
     * @tags snapshots
     * @name GetSimulatePendingSnapshot
     * @request GET:/snapshots/pending/simulate
     */
    getSimulatePendingSnapshot: (params: RequestParams = {}) =>
      this.request<PendingSnapshotModel, any>({
        path: `/snapshots/pending/simulate`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Returns given epoch's status, whether it's a current, pending or a finalized epoch. In case all fields are returning False and not an error, it is likely that there's a pending epoch that has not been snapshotted yet.
     *
     * @tags snapshots
     * @name GetEpochStatus
     * @request GET:/snapshots/status/{epoch}
     */
    getEpochStatus: (epoch: number, params: RequestParams = {}) =>
      this.request<EpochStatus, void>({
        path: `/snapshots/status/${epoch}`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  user = {
    /**
     * @description Returns a list of users who toggled patron mode and has a positive budget in given epoch
     *
     * @tags user
     * @name GetPatrons
     * @request GET:/user/patrons/{epoch}
     */
    getPatrons: (epoch: number, params: RequestParams = {}) =>
      this.request<Patrons, any>({
        path: `/user/patrons/${epoch}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Returns user's antisybil status.
     *
     * @tags user
     * @name GetAntisybilStatus
     * @request GET:/user/{user_address}/antisybil-status
     */
    getAntisybilStatus: (userAddress: string, params: RequestParams = {}) =>
      this.request<UserAntisybilStatus, any>({
        path: `/user/${userAddress}/antisybil-status`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Refresh cached antisybil status
     *
     * @tags user
     * @name PutAntisybilStatus
     * @request PUT:/user/{user_address}/antisybil-status
     */
    putAntisybilStatus: (userAddress: string, params: RequestParams = {}) =>
      this.request<UserAntisybilStatus, void>({
        path: `/user/${userAddress}/antisybil-status`,
        method: "PUT",
        format: "json",
        ...params,
      }),

    /**
     * @description Returns true if given user has enabled patron mode, false in the other case.
     *
     * @tags user
     * @name GetPatronMode
     * @request GET:/user/{user_address}/patron-mode
     */
    getPatronMode: (userAddress: string, params: RequestParams = {}) =>
      this.request<PatronModeStatus, any>({
        path: `/user/${userAddress}/patron-mode`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Toggle patron mode status
     *
     * @tags user
     * @name PatchPatronMode
     * @request PATCH:/user/{user_address}/patron-mode
     */
    patchPatronMode: (userAddress: string, payload: PatronModeRequest, params: RequestParams = {}) =>
      this.request<PatronModeStatus, void>({
        path: `/user/${userAddress}/patron-mode`,
        method: "PATCH",
        body: payload,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Returns true if given user has already accepted Terms of Service, false in the other case.
     *
     * @tags user
     * @name PostTermsOfService
     * @request POST:/user/{user_address}/tos
     */
    postTermsOfService: (
      userAddress: string,
      payload: {
        signature?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<TermsOfServiceConsentStatus, void>({
        path: `/user/${userAddress}/tos`,
        method: "POST",
        body: payload,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Returns true if given user has already accepted Terms of Service, false in the other case.
     *
     * @tags user
     * @name GetTermsOfService
     * @request GET:/user/{user_address}/tos
     */
    getTermsOfService: (userAddress: string, params: RequestParams = {}) =>
      this.request<TermsOfServiceConsentStatus, any>({
        path: `/user/${userAddress}/tos`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Returns user's uniqueness quotient score for given epoch
     *
     * @tags user
     * @name GetUqScore
     * @request GET:/user/{user_address}/uq/{epoch}
     */
    getUqScore: (userAddress: string, epoch: number, params: RequestParams = {}) =>
      this.request<UQScore, any>({
        path: `/user/${userAddress}/uq/${epoch}`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  validators = {
    /**
     * @description Return the number of all active Octant validators and the sum of their effective balances in gwei.
     *
     * @tags validators
     * @name GetActiveValidatorsSummary
     * @request GET:/validators/active/summary
     */
    getActiveValidatorsSummary: (params: RequestParams = {}) =>
      this.request<ActiveValidatorsSummary, void>({
        path: `/validators/active/summary`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  withdrawals = {
    /**
     * @description Returns a list containing amount and merkle proofs for all not claimed epochs
     *
     * @tags withdrawals
     * @name GetWithdrawals
     * @request GET:/withdrawals/{address}
     */
    getWithdrawals: (address: string, params: RequestParams = {}) =>
      this.request<WithdrawableRewards, any>({
        path: `/withdrawals/${address}`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
}
