import React, { useEffect, useState } from "react";
import { BracketsManager } from "brackets-manager";

import { getFirestore } from "firebase/firestore";
import { FirestoreAdapter } from "../utils/FirestoreAdapter";
import StatisticsActions from "../utils/StatisticsUtils";

import { Chip, Container, Stack, Typography, Paper } from "@mui/material";

import Loading from "./Loading";

const EventRankings = ({ eventId, tournamentId, wonStatisticsUpdated }) => {
  const db = getFirestore();
  const adapter = new FirestoreAdapter(
    db,
    `Events/${eventId}/TournamentData/${tournamentId}`,
    tournamentId
  );
  const manager = new BracketsManager(adapter);

  const { addWonEvent } = StatisticsActions();

  const [allMatches, setAllMatches] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [pairs, setPairs] = useState([]);
  const [noRankings, setNoRankings] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let stageData = {};

    const fetchTournamentData = async () => {
      try {
        const tournamentData = await manager.get.tournamentData(1);
        if (tournamentData.stage.length === 0) {
          setNoRankings(true);
          setLoading(false);
          return;
        }
        console.log("Current Stage ID:", tournamentData.stage[0].id);
        stageData = await manager.get.stageData(tournamentData.stage[0].id);
        console.log("Current Stage:", stageData);
        setAllMatches(stageData.match || []);
        setParticipants(stageData.participant || []);
        const tempMatches = stageData.match.filter((m) => m.status === 4) || [];

        const finalRankings = await getRankings(
          tempMatches,
          stageData.participant
        );

        if (finalRankings.length === 0) {
          setNoRankings(true);
          setLoading(false);
          return;
        }

        const isFinished = await manager.get.currentStage();
        console.log("isFinished", isFinished);
        console.log("wonStatisticsUpdated", wonStatisticsUpdated);

        // isFinished is null if stage is completed
        if (isFinished === null && !wonStatisticsUpdated) {
          const pair = stageData.participant.find(
            (p) => p.id === finalRankings[0].id
          );
          console.log("Winning Pair:", pair);
          if (pair.player1Id || pair.player2Id) {
            await addWonEvent(eventId, pair);
          }
        }

        setPairs(finalRankings);
        setLoading(false);
      } catch (error) {
        alert("Error getting the rankings");
        console.error(error);
      }
    };
    fetchTournamentData();
  }, []);

  function getRankings(matches, participants = []) {
    if (!matches || matches.length === 0) return [];

    // 1️⃣ Calcular vitórias e pontos totais
    const stats = {};
    for (const m of matches) {
      if (!m || !m.opponent1 || !m.opponent2) continue;
      const a = m.opponent1,
        b = m.opponent2;
      const sA = typeof m.scoreTeam1 === "number" ? m.scoreTeam1 : 0;
      const sB = typeof m.scoreTeam2 === "number" ? m.scoreTeam2 : 0;
      const scoreDiffA =
        typeof m.scoreTeam1 === "number" ? m.scoreTeam1 - m.scoreTeam2 : 0;
      const scoreDiffB =
        typeof m.scoreTeam2 === "number" ? m.scoreTeam2 - m.scoreTeam1 : 0;
      stats[a.id] ??= { id: a.id, wins: 0, points: 0, scoreDiff: 0 };
      stats[b.id] ??= { id: b.id, wins: 0, points: 0, scoreDiff: 0 };
      if (m.status === 4) {
        // apenas jogos completos
        if (a.result === "win") stats[a.id].wins += 1;
        if (b.result === "win") stats[b.id].wins += 1;
      }
      stats[a.id].points += sA;
      stats[b.id].points += sB;
      stats[a.id].scoreDiff += scoreDiffA;
      stats[b.id].scoreDiff += scoreDiffB;
    }

    const allTeams = Object.values(stats);
    console.log(allTeams);

    // 2️⃣ Criar mini-tabela dos confrontos diretos
    function computeDirectMini(ids) {
      const mini = {};
      for (const id of ids)
        mini[id] = { wins: 0, pointsFor: 0, pointsAgainst: 0 };

      for (const m of matches) {
        if (m.status !== 4 || !m.opponent1 || !m.opponent2) continue;
        const a = m.opponent1.id,
          b = m.opponent2.id;
        if (!ids.includes(a) || !ids.includes(b)) continue; // só entre empatados
        const sA = m.scoreTeam1,
          sB = m.scoreTeam2;
        if (sA > sB) mini[a].wins += 1;
        else if (sB > sA) mini[b].wins += 1;
        mini[a].pointsFor += sA;
        mini[a].pointsAgainst += sB;
        mini[b].pointsFor += sB;
        mini[b].pointsAgainst += sA;
      }
      return mini;
    }

    // 3️⃣ Ordenação principal
    function sortTeams(teams) {
      if (teams.length <= 1) return teams;

      // agrupa por vitórias
      const groups = {};
      for (const t of teams) {
        groups[t.wins] ??= [];
        groups[t.wins].push(t);
      }
      const winsKeys = Object.keys(groups)
        .map(Number)
        .sort((a, b) => b - a);

      const result = [];
      for (const w of winsKeys) {
        const group = groups[w];

        if (group.length === 1) {
          result.push(group[0]);
          continue;
        } else if (group.length === 2) {
          // confronto direto
          console.log(matches);
          const match = matches.filter(
            (m) =>
              (m.opponent1.id === group[0].id &&
                m.opponent2.id === group[1].id) ||
              (m.opponent1.id === group[1].id && m.opponent2.id === group[0].id)
          );
          console.log(match);

          if (match[0].scoreTeam1 !== match[0].scoreTeam2) {
            console.log("Confronto direto:", match[0]);
            if (match[0].scoreTeam1 > match[0].scoreTeam2) {
              result.push({
                ...group.filter((i) => i.id === match[0].opponent1.id)[0],
                miniWins: 1,
              });
              result.push(
                group.filter((i) => i.id === match[0].opponent2.id)[0]
              );
            } else {
              result.push({
                ...group.filter((i) => i.id === match[0].opponent2.id)[0],
                miniWins: 1,
              });
              result.push(
                group.filter((i) => i.id === match[0].opponent1.id)[0]
              );
            }
            continue;
          }
        }

        // verificar diferença de pontos
        const pointsMap = {};
        for (const t of group) {
          pointsMap[t.scoreDiff] ??= [];
          pointsMap[t.scoreDiff].push(t);
        }

        const pointsKeys = Object.keys(pointsMap)
          .map(Number)
          .sort((a, b) => b - a);
        for (const pts of pointsKeys) {
          const bucket = pointsMap[pts];
          if (bucket.length === 1) {
            result.push(bucket[0]);
            continue;
          }

          if (bucket.length >= 2) {
            // mini-tabela de confrontos diretos entre empatados
            const ids = bucket.map((x) => x.id);
            const mini = computeDirectMini(ids);
            const enriched = bucket.map((p) => ({
              ...p,
              miniWins: mini[p.id].wins,
              miniDiff: mini[p.id].pointsFor - mini[p.id].pointsAgainst,
            }));

            // ordenar por: miniWins desc, miniDiff desc, pontos totais desc, id
            enriched.sort((a, b) => {
              if (b.miniWins !== a.miniWins) return b.miniWins - a.miniWins;
              if (b.miniDiff !== a.miniDiff) return b.miniDiff - a.miniDiff;
              if (b.points !== a.points) return b.points - a.points;
              return String(a.id).localeCompare(String(b.id));
            });

            result.push(...enriched);
          }
        }
      }

      console.log(result);

      return result;
    }

    const sorted = sortTeams(allTeams);
    console.log(allTeams);
    console.log("sorted", sorted);

    // 4️⃣ Adicionar nomes se fornecidos
    return sorted.map((r) => {
      const p = participants.find((x) => x.id === r.id);
      return { ...r, name: p?.name ?? null };
    });
  }

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ py: 3, flex: 1 }}>
        <Loading isGenericLoading={false} />
      </Container>
    );
  }

  if (noRankings) {
    return (
      <Container maxWidth="sm" sx={{ py: 3, flex: 1 }}>
        <Paper elevation={1} sx={{ p: 2.5 }}>
          <Stack spacing={1.25}>
            <Typography
              variant="body1"
              color="text.secondary"
              textAlign="center"
            >
              No rankings available
            </Typography>
          </Stack>
        </Paper>
      </Container>
    );
  }

  return (
    <Paper elevation={1} sx={{ p: 2.5 }}>
      <Stack spacing={1.25}>
        {pairs?.map((pair, idx) => {
          const pairName1 =
            participants.find((p) => p.id === pair.id)?.name.split(" & ")[0] ||
            "Unknown";
          const pairName2 =
            participants.find((p) => p.id === pair.id)?.name.split(" & ")[1] ||
            "Unknown";

          return (
            <Stack
              key={pair.id}
              direction="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <Stack direction="row" spacing={1.25} alignItems="center">
                <Chip size="small" label={`#${idx + 1}`} />
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body1" fontWeight={600}>
                    {`${pairName1} / ${pairName2}`} {idx === 0 ? "🏆" : null}
                  </Typography>
                </Stack>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  color="primary"
                  label={
                    <Typography
                      variant="body2"
                      sx={{ color: "white", fontWeight: "bold" }}
                    >{`${pair.wins} wins`}</Typography>
                  }
                />
                <Chip
                  variant="outlined"
                  label={`${pair.scoreDiff} Score Diff`}
                  title="Score Difference"
                  size="small"
                  sx={{ minWidth: "100px" }}
                />
                {pair.miniWins !== undefined && pair.miniDiff !== undefined ? (
                  <>
                    <Chip
                      variant="outlined"
                      label={`${pair.miniWins} Direct Wins`}
                      size="small"
                      title="Represents how many games a team has won against the other tied teams"
                    />
                    <Chip
                      variant="outlined"
                      label={`${pair.miniDiff} Direct Diff`}
                      size="small"
                      title="Represents the difference in points (scored – conceded) only between teams tied on points"
                    />
                  </>
                ) : null}
              </Stack>
            </Stack>
          );
        })}
      </Stack>
    </Paper>
  );
};

export default EventRankings;
