# AI Insights Tool Test Results

> Generated: 2026-02-05T19:21:45.981Z

**Tools available:** get_chain_timeseries, get_landing_summary, get_economics_data, get_fees_table, get_chain_overview, get_blockspace_breakdown, get_metric_comparison, get_top_apps, get_da_metrics

---

## Summary

| Result | Count |
|--------|-------|
| Passed | 16 |
| Failed | 0 |
| Total  | 16 |

## Landing Summary (no args)

| | |
|---|---|
| **Tool** | `get_landing_summary` |
| **Args** | `{}` |
| **Status** | PASS |
| **Duration** | 129ms |

<details>
<summary>Response data (click to expand)</summary>

```json
{
  "data": {
    "data": {
      "metrics": {
        "engagement": {
          "metric_name": "Ethereum ecosystem engagement",
          "source": [
            "RPC"
          ],
          "weekly": {
            "latest_total_l2": 7619033,
            "latest_total": 11941271,
            "latest_total_comparison_l2": 0.13549095053847285,
            "latest_total_comparison": 0.08392341416598838,
            "l2_dominance": 1.6313,
            "l2_dominance_comparison": 0.0836,
            "cross_chain_users": 612765,
            "cross_chain_users_comparison": 0.4041071563602034,
            "timechart": {
              "types": [
                "unix",
                "value"
              ],
              "compositions": {
                "single_l2": [
                  [
                    1641168000000,
                    1142653
                  ],
                  [
                    1641772800000,
                    1005971
                  ],
                  [
                    1642377600000,
                    864019
                  ],
                  [
                    1642982400000,
                    921234
                  ],
                  [
                    1643587200000,
                    898966
                  ],
                  [
                    1644192000000,
                    896615
                  ],
                  [
                    1644796800000,
                    948320
                  ],
                  [
                    1645401600000,
                    859910
                  ],
                  [
                    1646006400000,
                    1043264
                  ],
                  [
                    1646611200000,
                    1076035
                  ],
                  [
                    1647216000000,
                    1091678
                  ],
                  [
                    1647820800000,
                    1071741
      
  ... (truncated)
```
</details>

---

## Economics Data (no args)

| | |
|---|---|
| **Tool** | `get_economics_data` |
| **Args** | `{}` |
| **Status** | PASS |
| **Duration** | 31ms |

<details>
<summary>Response data (click to expand)</summary>

```json
{
  "data": [
    {
      "chain": "data"
    },
    {
      "chain": "last_updated_utc",
      "raw": "2026-02-05 08:22:59"
    }
  ],
  "count": 2
}
```
</details>

---

## Fees Table (no args)

| | |
|---|---|
| **Tool** | `get_fees_table` |
| **Args** | `{}` |
| **Status** | PASS |
| **Duration** | 257ms |

<details>
<summary>Response data (click to expand)</summary>

```json
{
  "data": {
    "chain_data": {
      "arbitrum": {
        "hourly": {
          "txcosts_median": {
            "types": [
              "unix",
              "value_eth",
              "value_usd",
              "normalized"
            ],
            "data": [
              [
                1770310800000,
                0.0000013562513,
                0.0029,
                0.2
              ],
              [
                1770307200000,
                0.00000371542446,
                0.008,
                1
              ],
              [
                1770303600000,
                0.000003650219386,
                0.0079,
                0.98
              ],
              [
                1770300000000,
                0.000001248348754,
                0.0027,
                0.16
              ],
              [
                1770296400000,
                0.00000111218562,
                0.0024,
                0.12
              ],
              [
                1770292800000,
                0.000001393962482,
                0.003,
                0.21
              ],
              [
                1770289200000,
                0.000001269964848,
                0.0027,
                0.17
              ],
              [
                1770285600000,
                7.70320278e-7,
                0.0017,
                0
              ],
              [
                1770282000000,
                0.000001023915276,
                0.0022,
                0.09
              ],
              [
                1770278400000,
                0.00000100783517,
                0.0022,
                0.08
              ],
              [
                1770274800000,
                8.50413992e-7,
                0.0018,
                0.03
              ],
              [
                1770271200000,
                0.00000107791484,
                0.0023,
                0.1
              ],
              [
             
  ... (truncated)
```
</details>

---

## Chain Overview — Base

| | |
|---|---|
| **Tool** | `get_chain_overview` |
| **Args** | `{"chain":"base"}` |
| **Status** | PASS |
| **Duration** | 10ms |

<details>
<summary>Response data (click to expand)</summary>

```json
{
  "data": {
    "last_updated_utc": "2026-02-05 08:27:26",
    "data": "{Object with keys: chain_id, chain_name, highlights, events, ranking, kpi_cards, achievements, blockspace, ecosystem}"
  }
}
```
</details>

---

## Chain Timeseries — Arbitrum DAA

| | |
|---|---|
| **Tool** | `get_chain_timeseries` |
| **Args** | `{"chain":"arbitrum","metric":"daa"}` |
| **Status** | PASS |
| **Duration** | 11ms |

<details>
<summary>Response data (click to expand)</summary>

```json
{
  "types": [
    "unix",
    "value"
  ],
  "data": [
    [
      1767657600000,
      192410
    ],
    [
      1767744000000,
      196626
    ],
    [
      1767830400000,
      192202
    ],
    [
      1767916800000,
      151088
    ],
    [
      1768003200000,
      140214
    ],
    [
      1768089600000,
      129402
    ],
    [
      1768176000000,
      160844
    ],
    [
      1768262400000,
      168946
    ],
    [
      1768348800000,
      156912
    ],
    [
      1768435200000,
      151745
    ],
    [
      1768521600000,
      169368
    ],
    [
      1768608000000,
      140040
    ],
    [
      1768694400000,
      136629
    ],
    [
      1768780800000,
      163539
    ],
    [
      1768867200000,
      167449
    ],
    [
      1768953600000,
      159750
    ],
    [
      1769040000000,
      153262
    ],
    [
      1769126400000,
      196617
    ],
    [
      1769212800000,
      149357
    ],
    [
      1769299200000,
      152864
    ],
    [
      1769385600000,
      179240
    ],
    [
      1769472000000,
      245431
    ],
    [
      1769558400000,
      263292
    ],
    [
      1769644800000,
      288586
    ],
    [
      1769731200000,
      380630
    ],
    [
      1769817600000,
      314966
    ],
    [
      1769904000000,
      341870
    ],
    [
      1769990400000,
      311442
    ],
    [
      1770076800000,
      316121
    ],
    [
      1770163200000,
      381960
    ]
  ],
  "count": 30
}
```
</details>

---

## Blockspace Breakdown — all chains (7d)

| | |
|---|---|
| **Tool** | `get_blockspace_breakdown` |
| **Args** | `{"period":"7d"}` |
| **Status** | PASS |
| **Duration** | 24ms |

<details>
<summary>Response data (click to expand)</summary>

```json
{
  "period": "7d",
  "data": [
    {
      "chain": "arbitrum",
      "chain_name": "Arbitrum One",
      "data": {
        "social": {
          "data": [
            0.055381509565587995,
            141.9848892337316,
            13005,
            0.00048470680282552395,
            0.0004825221947749045,
            0.00041986740906843867
          ]
        },
        "utility": {
          "data": [
            7.466425923384821,
            19247.246080731682,
            1199582,
            0.06534721545593614,
            0.06540994237040929,
            0.03872859564053332
          ]
        },
        "token_transfers": {
          "data": [
            18.873479036932203,
            49646.149014389695,
            7452430,
            0.1651833572963899,
            0.16871773407598759,
            0.24060226646396804
          ]
        },
        "cross_chain": {
          "data": [
            5.9486651830895685,
            15334.209191172358,
            465746,
            0.05206355884106247,
            0.05211185721236724,
            0.01503664485228674
          ]
        },
        "unlabeled": {
          "data": [
            48.276544636963074,
            124519.99856904655,
            11238194,
            0.4225231451073687,
            0.4231694184301278,
            0.3628259436669337
          ]
        },
        "finance": {
          "data": [
            33.56711444305556,
            85183.4867997378,
            10591873,
            0.29378413209382126,
            0.28948800982283474,
            0.3419594212758132
          ]
        },
        "collectibles": {
          "data": [
            0.07014105169628797,
            182.5903167982761,
            13234,
            0.0006138844025958536,
            0.0006205158934984632,
            0.00042726069139651805
          ]
        }
      }
    },
    {
      "chain": "arbitrum_nova",
      "chain_name": "Arbitrum Nova",
      "data": {
        "social": {
       
  ... (truncated)
```
</details>

---

## Blockspace Breakdown — Base only

| | |
|---|---|
| **Tool** | `get_blockspace_breakdown` |
| **Args** | `{"chain":"base","period":"7d"}` |
| **Status** | PASS |
| **Duration** | 25ms |

<details>
<summary>Response data (click to expand)</summary>

```json
{
  "chain": "base",
  "chain_name": "Base Chain",
  "period": "7d",
  "data": {
    "social": {
      "data": [
        0.7576282111822363,
        1886.7040919562562,
        118987,
        0.00038230946157258154,
        0.0003743595652063231,
        0.0014452627401227817
      ]
    },
    "utility": {
      "data": [
        104.6396200590354,
        274456.15720596607,
        3155767,
        0.05280257019667233,
        0.054457552786293474,
        0.03833118291585678
      ]
    },
    "token_transfers": {
      "data": [
        50.92333816963174,
        131562.64732311078,
        7114491,
        0.02569660647500301,
        0.02610464230148842,
        0.08641539628059258
      ]
    },
    "cross_chain": {
      "data": [
        3.3128110925959007,
        8539.74951420599,
        375430,
        0.0016716893674348298,
        0.001694455918518878,
        0.004560119933474212
      ]
    },
    "unlabeled": {
      "data": [
        675.3313420435823,
        1727613.3996361243,
        36213968,
        0.3407813462448643,
        0.34279281202056794,
        0.4398690497482812
      ]
    },
    "finance": {
      "data": [
        1145.6119359293743,
        2892778.7238830826,
        35159908,
        0.5780913064375485,
        0.5739847546459242,
        0.4270660238391162
      ]
    },
    "collectibles": {
      "data": [
        1.1378446266104152,
        2980.6631080159073,
        190424,
        0.0005741718169045951,
        0.0005914227620010026,
        0.0023129645425562506
      ]
    }
  }
}
```
</details>

---

## Metric Comparison — DAA top 5

| | |
|---|---|
| **Tool** | `get_metric_comparison` |
| **Args** | `{"metric":"daa","top_n":5}` |
| **Status** | PASS |
| **Duration** | 19ms |

<details>
<summary>Response data (click to expand)</summary>

```json
{
  "metric": "daa",
  "metric_name": "Active Addresses",
  "data": [
    {
      "rank": 1,
      "chain": "base",
      "chain_name": "Base Chain",
      "current": 758965,
      "change_7d": 34.16,
      "change_30d": 31.01
    },
    {
      "rank": 2,
      "chain": "celo",
      "chain_name": "Celo",
      "current": 746829,
      "change_7d": 4.03,
      "change_30d": 4.31
    },
    {
      "rank": 3,
      "chain": "ethereum",
      "chain_name": "Ethereum Mainnet",
      "current": 595910,
      "change_7d": 17.83,
      "change_30d": 35.21
    },
    {
      "rank": 4,
      "chain": "arbitrum",
      "chain_name": "Arbitrum One",
      "current": 257946,
      "change_7d": -24.2,
      "change_30d": 24.58
    },
    {
      "rank": 5,
      "chain": "starknet",
      "chain_name": "Starknet",
      "current": 69463,
      "change_7d": -0.7,
      "change_30d": 9.48
    }
  ],
  "count": 5,
  "total_chains": 34
}
```
</details>

---

## Metric Comparison — TVL top 10

| | |
|---|---|
| **Tool** | `get_metric_comparison` |
| **Args** | `{"metric":"tvl"}` |
| **Status** | PASS |
| **Duration** | 21ms |

<details>
<summary>Response data (click to expand)</summary>

```json
{
  "metric": "tvl",
  "metric_name": "Total Value Secured",
  "data": [
    {
      "rank": 1,
      "chain": "arbitrum",
      "chain_name": "Arbitrum One",
      "current": 16625319371.644234,
      "change_7d": -3.74,
      "change_30d": -3.52
    },
    {
      "rank": 2,
      "chain": "base",
      "chain_name": "Base Chain",
      "current": 12172757905.103035,
      "change_7d": -3.24,
      "change_30d": -20.49
    },
    {
      "rank": 3,
      "chain": "optimism",
      "chain_name": "OP Mainnet",
      "current": 2248775084.01805,
      "change_7d": -5.97,
      "change_30d": -24.67
    },
    {
      "rank": 4,
      "chain": "mantle",
      "chain_name": "Mantle",
      "current": 1670351657.1696465,
      "change_7d": -2.51,
      "change_30d": -18.73
    },
    {
      "rank": 5,
      "chain": "starknet",
      "chain_name": "Starknet",
      "current": 815601914.8423839,
      "change_7d": -5.01,
      "change_30d": 11.74
    },
    {
      "rank": 6,
      "chain": "linea",
      "chain_name": "Linea",
      "current": 697603189.6117847,
      "change_7d": -10.8,
      "change_30d": -50.28
    },
    {
      "rank": 7,
      "chain": "worldchain",
      "chain_name": "World Chain",
      "current": 531945051.34000015,
      "change_7d": -8.44,
      "change_30d": -24.69
    },
    {
      "rank": 8,
      "chain": "zksync_era",
      "chain_name": "ZKsync Era",
      "current": 491228311.38757837,
      "change_7d": -1.04,
      "change_30d": -23.22
    },
    {
      "rank": 9,
      "chain": "ink",
      "chain_name": "Ink",
      "current": 417170593.39,
      "change_7d": 0.27,
      "change_30d": 22.65
    },
    {
      "rank": 10,
      "chain": "celo",
      "chain_name": "Celo",
      "current": 317061451.57945114,
      "change_7d": -1.83,
      "change_30d": -15.43
    }
  ],
  "count": 10,
  "total_chains": 33
}
```
</details>

---

## Top Apps — 7d all chains

| | |
|---|---|
| **Tool** | `get_top_apps` |
| **Args** | `{"timespan":"7d","limit":10}` |
| **Status** | PASS |
| **Duration** | 10ms |

<details>
<summary>Response data (click to expand)</summary>

```json
{
  "timespan": "7d",
  "chain": "all",
  "data": [
    {
      "name": "polymarket",
      "chain": "polygon_pos",
      "gas_fees_eth": 280.8650028908933,
      "gas_fees_usd": 688159.9643999999,
      "txcount": 15982855,
      "prev_txcount": 13242067,
      "daa": 8089,
      "prev_daa": 6447
    },
    {
      "name": "tetherto",
      "chain": "ethereum",
      "gas_fees_eth": 141.984794957606,
      "gas_fees_usd": 364382.98520840454,
      "txcount": 2905201,
      "prev_txcount": 2969798,
      "daa": 1283588,
      "prev_daa": 1285435
    },
    {
      "name": "sigmabot",
      "chain": "base",
      "gas_fees_eth": 142.87848662415522,
      "gas_fees_usd": 358152.7623299372,
      "txcount": 221427,
      "prev_txcount": 42731,
      "daa": 3488,
      "prev_daa": 1606
    },
    {
      "name": "kumbaya-xyz",
      "chain": "megaeth",
      "gas_fees_eth": 69.58420745025873,
      "gas_fees_usd": 201735.6111,
      "txcount": 362700715,
      "prev_txcount": 3273551246,
      "daa": 52039,
      "prev_daa": 50124
    },
    {
      "name": "circlefin",
      "chain": "ethereum",
      "gas_fees_eth": 78.24554715502612,
      "gas_fees_usd": 201698.3592157911,
      "txcount": 1424465,
      "prev_txcount": 1426683,
      "daa": 679831,
      "prev_daa": 699192
    },
    {
      "name": "uniswap",
      "chain": "base",
      "gas_fees_eth": 79.85073218954697,
      "gas_fees_usd": 200656.32049107907,
      "txcount": 2413694,
      "prev_txcount": 1935350,
      "daa": 180320,
      "prev_daa": 291502
    },
    {
      "name": "uniswap",
      "chain": "ethereum",
      "gas_fees_eth": 72.85473174176846,
      "gas_fees_usd": 188111.6003987568,
      "txcount": 360604,
      "prev_txcount": 463789,
      "daa": 69735,
      "prev_daa": 84190
    },
    {
      "name": "metamask",
      "chain": "ethereum",
      "gas_fees_eth": 53.93961769068862,
      "gas_fees_usd": 138511.85663964206,
      "txcount": 73056,
      "prev_txcount": 63938,
      "daa
  ... (truncated)
```
</details>

---

## Top Apps — 7d Base only

| | |
|---|---|
| **Tool** | `get_top_apps` |
| **Args** | `{"timespan":"7d","chain":"base","limit":5}` |
| **Status** | PASS |
| **Duration** | 8ms |

<details>
<summary>Response data (click to expand)</summary>

```json
{
  "timespan": "7d",
  "chain": "base",
  "data": [
    {
      "name": "sigmabot",
      "chain": "base",
      "gas_fees_eth": 142.87848662415522,
      "gas_fees_usd": 358152.7623299372,
      "txcount": 221427,
      "prev_txcount": 42731,
      "daa": 3488,
      "prev_daa": 1606
    },
    {
      "name": "uniswap",
      "chain": "base",
      "gas_fees_eth": 79.85073218954697,
      "gas_fees_usd": 200656.32049107907,
      "txcount": 2413694,
      "prev_txcount": 1935350,
      "daa": 180320,
      "prev_daa": 291502
    },
    {
      "name": "blazingapp",
      "chain": "base",
      "gas_fees_eth": 28.859336362026145,
      "gas_fees_usd": 73174.96743020411,
      "txcount": 7550862,
      "prev_txcount": 7506324,
      "daa": 1155,
      "prev_daa": 855
    },
    {
      "name": "eth-infinitism-account-abstraction",
      "chain": "base",
      "gas_fees_eth": 17.793061272753963,
      "gas_fees_usd": 45510.17608840573,
      "txcount": 1218640,
      "prev_txcount": 1340582,
      "daa": 701,
      "prev_daa": 772
    },
    {
      "name": "avantis-labs",
      "chain": "base",
      "gas_fees_eth": 12.395028196114607,
      "gas_fees_usd": 31733.457916390224,
      "txcount": 112685,
      "prev_txcount": 108340,
      "daa": 2007,
      "prev_daa": 2037
    }
  ],
  "count": 5
}
```
</details>

---

## DA Metrics — all layers

| | |
|---|---|
| **Tool** | `get_da_metrics` |
| **Args** | `{}` |
| **Status** | PASS |
| **Duration** | 10ms |

<details>
<summary>Response data (click to expand)</summary>

```json
{
  "all_da": {
    "da_id": "all_da",
    "da_name": "All DAs",
    "metrics": {
      "fees_paid": {
        "da_celestia": {
          "metric_name": "Celestia",
          "source": [],
          "avg": true,
          "daily": {
            "types": [
              "unix",
              "usd",
              "eth"
            ],
            "data": [
              [
                1698710400000,
                6.5069379257772635,
                0.0035957098859097816
              ],
              [
                1698796800000,
                2.1926484787901996,
                0.0012068717957042395
              ],
              [
                1698883200000,
                2.1468336617591706,
                0.0011626614252129442
              ],
              [
                1698969600000,
                27.305679157647518,
                0.015162180184909578
              ],
              [
                1699228800000,
                1.0357725775024478,
                0.000546311399129003
              ],
              [
                1699315200000,
                0.09427172340255752,
                0.00004965542186119269
              ],
              [
                1699574400000,
                0.019616722982536628,
                0.000009215745276994672
              ],
              [
                1699660800000,
                3.4913666958174576,
                0.0016794674335679231
              ],
              [
                1699747200000,
                1.0309793511099876,
                0.0005021831806613303
              ],
              [
                1699833600000,
                0.07500934891177088,
                0.000036659900571162595
              ],
              [
                1699920000000,
                1.4487256150313876,
                0.000703082996574157
              ],
              [
                1700092800000,
                3.5000379801408013,
                0.0016976996784275331
  ... (truncated)
```
</details>

---

## DA Metrics — ethereum_blobs only

| | |
|---|---|
| **Tool** | `get_da_metrics` |
| **Args** | `{"da_layer":"ethereum_blobs"}` |
| **Status** | PASS |
| **Duration** | 10ms |

<details>
<summary>Response data (click to expand)</summary>

```json
{
  "da_layer": "ethereum_blobs",
  "data": {
    "1d": {
      "fees": {
        "types": [
          "usd",
          "eth"
        ],
        "total": [
          213.41882542651268,
          0.0958330498487419
        ]
      },
      "size": {
        "types": [
          "bytes"
        ],
        "total": [
          3982024304
        ]
      },
      "fees_per_mb": {
        "types": [
          "usd",
          "eth"
        ],
        "total": [
          0.05619901869148184,
          0.00002523546528263339
        ]
      },
      "da_consumers": {
        "count": 33,
        "chains": {
          "types": [
            "da_consumer_key",
            "name",
            "gtp_origin_key"
          ],
          "values": [
            [
              "base",
              "Base",
              "base"
            ],
            [
              "worldchain",
              "Worldchain",
              "worldchain"
            ],
            [
              "arbitrum",
              "Arbitrum",
              "arbitrum"
            ],
            [
              "optimism",
              "OP Mainnet",
              "optimism"
            ],
            [
              "taiko",
              "Taiko",
              "taiko"
            ],
            [
              "soneium",
              "Soneium",
              "soneium"
            ],
            [
              "blast",
              "Blast",
              "blast"
            ],
            [
              "scroll",
              "Scroll",
              "scroll"
            ],
            [
              "unichain",
              "Unichain",
              "unichain"
            ],
            [
              "abstract",
              "Abstract",
              null
            ],
            [
              "starknet",
              "Starknet",
              "starknet"
            ],
            [
              "linea",
              "Linea",
              "linea"
            ],
            [
              
  ... (truncated)
```
</details>

---

## Error: invalid chain key

| | |
|---|---|
| **Tool** | `get_chain_overview` |
| **Args** | `{"chain":"nonexistent_chain_xyz"}` |
| **Status** | PASS (expected error) |
| **Duration** | 1068ms |

**Error response:**
```json
{
  "error": "HTTP 403 from https://api.growthepie.com/v1/chains/nonexistent_chain_xyz/overview.json",
  "suggestion": "Check the chain key is valid (e.g. 'base', 'arbitrum', 'optimism')",
  "partial_data": null
}
```

---

## Error: invalid chain in blockspace

| | |
|---|---|
| **Tool** | `get_blockspace_breakdown` |
| **Args** | `{"chain":"nonexistent_chain_xyz"}` |
| **Status** | PASS (expected error) |
| **Duration** | 41ms |

**Error response:**
```json
{
  "error": "No blockspace data found for chain 'nonexistent_chain_xyz'",
  "suggestion": "Available chains: all_l2s, arbitrum, arbitrum_nova, base, celo, ethereum, linea, mantle, megaeth, mode",
  "partial_data": null
}
```

---

## Error: invalid DA layer

| | |
|---|---|
| **Tool** | `get_da_metrics` |
| **Args** | `{"da_layer":"fake_da_layer"}` |
| **Status** | PASS (expected error) |
| **Duration** | 9ms |

**Error response:**
```json
{
  "error": "No data found for DA layer 'fake_da_layer'",
  "suggestion": "Available layers: da_celestia, da_eigenda, da_ethereum_blobs, totals",
  "partial_data": null
}
```

---
