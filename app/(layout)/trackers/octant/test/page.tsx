import Container from "@/components/layout/Container";
import { EpochChart } from "../EpochChart";

export default function DebugPage() {
  var t = [
    {
      "epoch": 1,
      "toTs": "1697731200",
      "fromTs": "1691510400",
      "decisionWindow": "1209600",
      "info": {
        "stakingProceeds": "412042049081445321216",
        "totalEffectiveDeposit": "94755727584613854218098688",
        "totalRewards": "329633639265156268032",
        "vanillaIndividualRewards": "101469205666663117330",
        "operationalCost": "82408409816289053184",
        "totalWithdrawals": "320096281600650694595",
        "patronsRewards": "16050223937523865304",
        "matchedRewards": "244214657536017016006",
        "leftover": "9537357664505573437",
        "ppf": null,
        "communityFund": null
      }
    },
    {
      "epoch": 2,
      "toTs": "1705507200",
      "fromTs": "1697731200",
      "decisionWindow": "1209600",
      "info": {
        "stakingProceeds": "966657119479408821563",
        "totalEffectiveDeposit": "143000608744890669292589348",
        "totalRewards": "365545462174813064230",
        "vanillaIndividualRewards": "138232556533137973669",
        "operationalCost": "241664279869852205390",
        "totalWithdrawals": "365233091278490434580",
        "patronsRewards": "8695859401745522",
        "matchedRewards": "227321601501076836083",
        "leftover": "359759748331066181593",
        "ppf": null,
        "communityFund": null
      }

    },
    {
      "epoch": 3,
      "toTs": "1713283200",
      "fromTs": "1705507200",
      "decisionWindow": "1209600",
      "info": {
        "stakingProceeds": "959848624830407629247",
        "totalEffectiveDeposit": "152790615666562307080359072",
        "totalRewards": "671894037381285340472",
        "vanillaIndividualRewards": "146655862334541166188",
        "operationalCost": "239962156207601907311",
        "totalWithdrawals": "573393994156646120813",
        "patronsRewards": "25889892012297588",
        "matchedRewards": "335972908582654967824",
        "leftover": "3854465046588467390",
        "ppf": "189291156356101504048",
        "communityFund": "47992431241520381462"
      }
    },
    {
      "epoch": 4,
      "toTs": "1721059200",
      "fromTs": "1713283200",
      "decisionWindow": "1209600",
      "info": {
        "stakingProceeds": "850133917361881760113",
        "totalEffectiveDeposit": "155200359957012122820085802",
        "totalRewards": "595093742153317232079",
        "vanillaIndividualRewards": "131941089986228847020",
        "operationalCost": "212533479340470440028",
        "totalWithdrawals": null,
        "patronsRewards": "25348317168816085",
        "matchedRewards": "297572219393827432124",
        "leftover": "191810598168683746956",
        "ppf": "165605781090429769019",
        "communityFund": "42506695868094088005"
      }
    },
    {
      "epoch": 5,
      "toTs": "1728835200",
      "fromTs": "1721059200",
      "decisionWindow": "1209600",
      "info": {
        "stakingProceeds": "936986301369862848512",
        "totalEffectiveDeposit": "156492756054822350065702805",
        "totalRewards": "655890410958903993958",
        "vanillaIndividualRewards": "146631568686984203526",
        "operationalCost": "234246575342465712128",
        "totalWithdrawals": null,
        "patronsRewards": null,
        "matchedRewards": null,
        "leftover": null,
        "ppf": "181313636792467793453",
        "communityFund": "46849315068493142425"
      }
    }
  ]

  // show the start and end of each epoch, and the decision window for each epoch
  return (
    <Container>
      <EpochChart />
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="text-left">Epoch</th>
            <th className="text-left">Start</th>
            <th className="text-left">End</th>
            <th className="text-left">End + Decision Window</th>
            <th className="text-left">Decision Window Days</th>
            <th className="text-left">Metrics</th>
          </tr>
        </thead>
        <tbody>
          {t.map((epoch, index) => (
            <tr key={index}>
              <td>{epoch.epoch}</td>
              <td>{new Date(parseInt(epoch.fromTs) * 1000).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',

                year: 'numeric',
              })}</td>
              <td>{new Date(parseInt(epoch.toTs) * 1000).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                year: 'numeric',
              })}</td>
              <td>{new Date((parseInt(epoch.toTs) + parseInt(epoch.decisionWindow)) * 1000).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',

                year: 'numeric',
              })}</td>
              <td>{parseInt(epoch.decisionWindow) / 86400}</td>
              <td>
                <div>Total Effective Deposit: {(parseInt(epoch.info.totalEffectiveDeposit) / 1e18).toLocaleString("en-GB",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}</div>
                <div>Staking Proceeds: {(parseInt(epoch.info.stakingProceeds) / 1e18).toLocaleString("en-GB",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}</div>
                <div className="pl-4">
                  Operational Cost: {(parseInt(epoch.info.operationalCost) / 1e18).toLocaleString("en-GB",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })} ({(parseInt(epoch.info.operationalCost) / parseInt(epoch.info.stakingProceeds) * 100).toFixed(2)}%)
                </div>
                <div className="pl-4">Community Fund: {epoch.info.communityFund ? (parseInt(epoch.info.communityFund) / 1e18).toLocaleString("en-GB",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }) : 0} ({epoch.info.communityFund ? (parseInt(epoch.info.communityFund) / parseInt(epoch.info.stakingProceeds) * 100).toFixed(2) : 0}%)
                </div>
                <div className="pl-4">Total Rewards: {(parseInt(epoch.info.totalRewards) / 1e18).toLocaleString("en-GB",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })} ({(parseInt(epoch.info.totalRewards) / parseInt(epoch.info.stakingProceeds) * 100).toFixed(2)}%)
                </div>
                <div className="pl-8">
                  Vanilla Individual Rewards: {(parseInt(epoch.info.vanillaIndividualRewards) / 1e18).toLocaleString("en-GB",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })} ({(parseInt(epoch.info.vanillaIndividualRewards) / parseInt(epoch.info.totalRewards) * 100).toFixed(2)}%)
                </div>
                <div className="pl-8">Patrons Rewards: {epoch.info.patronsRewards ? (parseInt(epoch.info.patronsRewards) / 1e18).toLocaleString("en-GB",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }) : 0} ({epoch.info.patronsRewards ? (parseInt(epoch.info.patronsRewards) / parseInt(epoch.info.totalRewards) * 100).toFixed(2) : 0}%)
                </div>
                <div className="pl-8">Matched Rewards: {epoch.info.matchedRewards ? (parseInt(epoch.info.matchedRewards) / 1e18).toLocaleString("en-GB",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }) : 0} ({epoch.info.matchedRewards ? (parseInt(epoch.info.matchedRewards) / parseInt(epoch.info.totalRewards) * 100).toFixed(2) : 0}%)
                </div>
                <div className="pl-8">Participation Promotion Fund: {epoch.info.ppf ? (parseInt(epoch.info.ppf) / 1e18).toLocaleString("en-GB",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }) : 0} ({epoch.info.ppf ? (parseInt(epoch.info.ppf) / parseInt(epoch.info.totalRewards) * 100).toFixed(2) : 0}%)
                </div>


              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* show days between the the end+decision window of each epoch */}
      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left">Epoch</th>
            <th className="text-left">Days to Next Epoch</th>
          </tr>
        </thead>
        <tbody>
          {t.map((epoch, index) => (
            <tr key={index}>
              <td>{epoch.epoch}</td>
              <td>{index > 0 ? (parseInt(t[index].fromTs) - parseInt(t[index - 1].fromTs)) / 86400 : 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Container>
  );


}