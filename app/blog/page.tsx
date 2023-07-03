"use client";
import { request, gql } from "graphql-request";
import ReactJson from "react-json-view";
import useSWR from "swr";
import { remark } from "remark";
import remarkParse from "remark-parse";
import html from "remark-html";
import { useMemo } from "react";
import moment from "moment";
import ShowLoading from "@/components/layout/ShowLoading";
import Container from "@/components/layout/Container";
import Heading from "@/components/layout/Heading";
import _ from "lodash";

const fetcher: any = (query: string) =>
  request("https://arweave.net/graphql", query);

type Transactions = {
  edges: {
    node: {
      id: string;
      tags: {
        name: string;
        value: string;
      }[];
      owner: {
        address: string;
        key: string;
      };
    };
  }[];
};

type FetchResponse = {
  transactions: Transactions;
};

const TRANSACTIONS_QUERY = gql`
  query Transactions {
    transactions(
      tags: [
        { name: "App-Name", values: ["MirrorXYZ"] }
        {
          name: "Contributor"
          values: ["0x6659C370ADF66A7DDBc931a51256DaAAF272C412"]
        }
      ]
      sort: HEIGHT_DESC
      first: 10
    ) {
      edges {
        node {
          id
          anchor
          signature
          recipient
          owner {
            address
            key
          }
          fee {
            winston
            ar
          }
          quantity {
            winston
            ar
          }
          data {
            size
            type
          }
          tags {
            name
            value
          }
          block {
            id
            timestamp
            height
            previous
          }
          parent {
            id
          }
        }
      }
    }
  }
`;

export default function Blog() {
  const { data, error, isLoading, isValidating } = useSWR<FetchResponse>(
    TRANSACTIONS_QUERY,
    fetcher,
  );

  const UniqueOriginalContentDigestTags = useMemo<string[]>(() => {
    if (!data) return [];
    const tags = data.transactions.edges.map((edge) => {
      return edge.node.tags.find(
        (tag) => tag.name === "Original-Content-Digest",
      );
    });

    return _.uniq(
      tags.map((t) => (t && t.value ? t.value : "")).filter((t) => t !== ""),
    );
  }, [data]);

  return (
    <>
      <ShowLoading dataLoading={[isLoading]} dataValidating={[isValidating]} />
      <Container className="flex flex-col w-full mt-[65px] md:mt-[75px]">
        <div className="flex justify-between items-start w-full">
          <div className="flex items-start">
            <Heading className="text-[30px] leading-snug md:text-[36px] mb-[15px] md:mb-[50px]">
              Blog
            </Heading>
          </div>
        </div>
        {/* <pre className="w-full">{JSON.stringify(data, null, 2)}</pre> */}
        {data &&
          UniqueOriginalContentDigestTags.map((value) => {
            return <Digest key={value} orgininalContentDigest={value} />;
          })}
      </Container>
    </>
  );
}

const Digest = ({
  orgininalContentDigest,
}: {
  orgininalContentDigest: string;
}) => {
  const DIGEST_QUERY = gql`
  query Transactions {
    transactions(
      tags: [
        { name: "App-Name", values: ["MirrorXYZ"] }
        {
          name: "Original-Content-Digest"
          values: ["${orgininalContentDigest}"]
        }
      ]
      sort: HEIGHT_DESC
      first: 1
    ) {
      edges {
        node {
          id
          anchor
          signature
          recipient
          owner {
            address
            key
          }
          fee {
            winston
            ar
          }
          quantity {
            winston
            ar
          }
          data {
            size
            type
          }
          tags {
            name
            value
          }
          block {
            id
            timestamp
            height
            previous
          }
          parent {
            id
          }
        }
      }
    }
  }
`;
  const { data, error, isLoading, isValidating } = useSWR<FetchResponse>(
    DIGEST_QUERY,
    fetcher,
  );

  return (
    <>
      {/* <ShowLoading dataLoading={[isLoading]} dataValidating={[isValidating]} /> */}
      {/* <Container className="flex flex-col w-full mt-[65px] md:mt-[75px]"> */}
      {/* <div className="flex justify-between items-start w-full">
          <div className="flex items-start">
            <Heading className="text-[30px] leading-snug md:text-[36px] mb-[15px] md:mb-[50px]">
              Blog
            </Heading>
          </div>
        </div> */}
      {/* <pre className="w-full">{JSON.stringify(data, null, 2)}</pre> */}
      {data &&
        data.transactions.edges.map((edge) => {
          return <BlogPost key={edge.node.id} transactionId={edge.node.id} />;
        })}
      {/* </Container> */}
    </>
  );
};

const BlogPost = ({ transactionId }: { transactionId: string }) => {
  const { data, error } = useSWR(`https://arweave.net/${transactionId}`);

  const processed = useMemo(() => {
    if (!data) return null;
    return remark().use(html).processSync(data.content.body).toString();
  }, [data]);

  if (!data) return <div>Loading...</div>;

  return (
    <div className="mb-[50px]">
      <h2 className="text-[18px] leading-snug md:text-[28px] mb-[15px] md:mb-[15px] font-semibold">
        {data.content.title}
      </h2>
      <div className="flex justify-between mb-8">
        <div className="text-base text-forest-500 bg-forest-100 dark:bg-forest-900 dark:text-forest-300 font-semibold rounded-full px-2 py-0 leading-tight flex items-center">
          {(data.authorship.contributor as string).slice(0, 6)}
        </div>
        <div>{moment.unix(data.content.timestamp).fromNow()}</div>
      </div>
      {processed && <div dangerouslySetInnerHTML={{ __html: processed }} />}
      {/* <pre className="w-full">{JSON.stringify(data, null, 2)}</pre> */}
    </div>
  );
};
