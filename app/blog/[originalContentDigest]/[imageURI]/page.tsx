"use client";
import { request, gql } from "graphql-request";
import ReactJson from "react-json-view";
import useSWR from "swr";
// import { remark } from "remark";
// import remarkParse from "remark-parse";
// import html from "remark-html";
import { useEffect, useMemo, useState } from "react";
import moment from "moment";
import ShowLoading from "@/components/layout/ShowLoading";
import Container from "@/components/layout/Container";
import Heading from "@/components/layout/Heading";
import _ from "lodash";
import Image from "next/image";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { Digest } from "@/components/layout/Blog";

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
  firstTransactions?: Transactions;
};

// alana: 0x26f35e0F8F3030907044aC0a43e72c1A17284137
// gtp: 0x9438b8B447179740cD97869997a2FCc9b4AA63a2

const TRANSACTIONS_QUERY = gql`
  query Transactions {
    transactions(
      tags: [
        { name: "App-Name", values: ["MirrorXYZ"] }
        {
          name: "Contributor"
          values: ["0x9438b8B447179740cD97869997a2FCc9b4AA63a2"]
        }
      ]
      sort: HEIGHT_DESC
      first: 200
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

export default function BlogEntry({ params }: { params: any }) {
  const { data, error, isLoading, isValidating } = useSWR<FetchResponse>(
    TRANSACTIONS_QUERY,
    fetcher,
  );

  const TagsByUniqueOriginalContentDigest = useMemo<
    {
      originalContentDigest: string;
      contentDigest: string;
    }[]
  >(() => {
    if (!data) return [];

    let tags: {
      originalContentDigest: string;
      contentDigest: string;
    }[] = [];

    for (let i = 0; i < data.transactions.edges.length; i++) {
      const edge = data.transactions.edges[i];
      const originalContentDigest = edge.node.tags.find(
        (tag) => tag.name === "Original-Content-Digest",
      )?.value;
      const contentDigest = edge.node.tags.find(
        (tag) => tag.name === "Content-Digest",
      )?.value;

      if (originalContentDigest && contentDigest) {
        tags.push({
          originalContentDigest,
          contentDigest,
        });
      }
    }

    console.log("tags", tags);

    return _.uniqBy(tags, "originalContentDigest");
    // return tags;
  }, [data]);

  return (
    <>
      <ShowLoading dataLoading={[isLoading]} dataValidating={[isValidating]} />
      <Container className="flex flex-col w-full mt-[25px] md:mt-[25px]">
        <div className="flex justify-between items-start w-full">
          <div className="flex items-start">
            <Heading className="text-[30px] leading-snug md:text-[36px] mb-[15px] md:mb-[50px]">
              Blog
            </Heading>
          </div>
        </div>
        {/* <pre className="w-full">{JSON.stringify(data, null, 2)}</pre> */}
        <div className="grid grid-cols-1 gap-8 mx-auto max-w-3xl">
          {data && (
            <Digest
              tags={{
                originalContentDigest: params.originalContentDigest,
                contentDigest: params.contentDigest,
              }}
              type="full"
            />
          )}
        </div>

        <div className="flex justify-center items-center w-full dark:text-gray-400 text-gray-600 text-[14px] my-[15px]">
          More Posts
        </div>
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
          {data &&
            TagsByUniqueOriginalContentDigest.map((value) => {
              return (
                <Digest
                  key={value.originalContentDigest}
                  tags={value}
                  type="card"
                />
              );
            })}
        </div>
      </Container>
    </>
  );
}
