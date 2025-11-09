import React, { useEffect, useState, useRef, useMemo } from "react";
import { BracketsManager } from "brackets-manager";

import { getFirestore } from "firebase/firestore";
import { FirestoreAdapter } from "../utils/FirestoreAdapter";

import { Avatar, Chip, Stack, Typography, Paper } from "@mui/material";

const EventRankings = ({ eventId, tournamentId }) => {
  const db = getFirestore();
  const adapter = new FirestoreAdapter(
    db,
    `Events/${eventId}/TournamentData/${tournamentId}`,
    tournamentId
  );
  const manager = new BracketsManager(adapter);

  const [allMatches, setAllMatches] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [pairs, setPairs] = useState([]);

  useEffect(() => {
    const fetchTournamentData = async () => {
      const stageId = await manager.get.tournamentData(1);
      console.log("Current Stage ID:", stageId);
      const stageData = await manager.get.stageData(stageId);
      console.log("Current Stage:", stageData);
      setAllMatches(stageData.match || []);
      setParticipants(stageData.participant || []);
      const tempMatches = stageData.match.filter((m) => m.status === 4) || [];

      console.log(getRankings(tempMatches, stageData.participant));
      const finalRankings = await getRankings(
        tempMatches,
        stageData.participant
      );
      console.log("finalRankings", finalRankings);
      setPairs(finalRankings);
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
      stats[a.id] ??= { id: a.id, wins: 0, points: 0 };
      stats[b.id] ??= { id: b.id, wins: 0, points: 0 };
      if (m.status === 4) {
        // apenas jogos completos
        if (a.result === "win") stats[a.id].wins += 1;
        if (b.result === "win") stats[b.id].wins += 1;
      }
      stats[a.id].points += sA;
      stats[b.id].points += sB;
    }

    const allTeams = Object.values(stats);

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
        }

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
                result.push(group.filter(i => i.id === match[0].opponent1.id)[0]);
                result.push(group.filter(i => i.id === match[0].opponent2.id)[0]);
            }else{
                result.push(group.filter(i => i.id === match[0].opponent2.id)[0]);
                result.push(group.filter(i => i.id === match[0].opponent1.id)[0]);
            }
            continue;
        }
        

        // verificar empate
        const pointsMap = {};
        for (const t of group) {
          pointsMap[t.points] ??= [];
          pointsMap[t.points].push(t);
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

      return result;
    }

    const sorted = sortTeams(allTeams);
    console.log(allTeams);
    console.log(sorted);

    // 4️⃣ Adicionar nomes se fornecidos
    return sorted.map((r) => {
      const p = participants.find((x) => x.id === r.id);
      return { ...r, name: p?.name ?? null };
    });
  }

  const initials = (n) =>
    n
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

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
                  <Avatar
                    sx={{
                      width: 28,
                      height: 28,
                      bgcolor: "primary.main",
                      fontSize: 12,
                    }}
                  >
                    {initials(pairName1)}
                  </Avatar>
                  <Avatar
                    sx={{
                      width: 28,
                      height: 28,
                      bgcolor: "primary.main",
                      fontSize: 12,
                    }}
                  >
                    {initials(pairName2)}
                  </Avatar>
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
                  label={`${pair.points} pts`}
                  size="small"
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
