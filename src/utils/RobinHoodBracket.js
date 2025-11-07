import { useEffect, useState } from "react";
import { getFirestore } from "firebase/firestore";
import { FirestoreAdapter } from './FirestoreAdapter';

import UploadScoreModal from "../components/UploadScoreModal";

import {
    Box,
    Divider,
    Typography,
    Paper,
    Chip
} from "@mui/material";

import { Sports } from '@mui/icons-material';


const RobinHoodBracket = ({ eventId, tournamentId }) => {
    const db = getFirestore();

    const [participants, setParticipants] = useState([]);
    const [matches, setMatches] = useState([]);
    const [stage, setStage] = useState(null);
    const [rounds, setRounds] = useState([]);
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState(null);

    const adapter = new FirestoreAdapter(db, `Events/${eventId}/TournamentData/${tournamentId}`, tournamentId);

    useEffect(() => {
        fetchTournamentData();
    }, []);

    const fetchTournamentData = async () => {
        const stageData = await adapter.select("stage"); // or your equivalent
        setStage(stageData[0]); // assuming one stage for round-robin

        const participantsData = await adapter.select("participant");
        setParticipants(participantsData);

        const matchesData = await adapter.select("match");
        setMatches(matchesData);

        const groupedByRound = matchesData.reduce((acc, match) => {
            const roundId = match.round_id?.id || `round-${match.id}`; // fallback if missing
            if (!acc[roundId]) acc[roundId] = [];
            acc[roundId].push(match);
            return acc;
        }, {});

        const roundKeys = Object.keys(groupedByRound);

        const tempRounds = roundKeys.map((roundId, index) => ({
            header: `Round ${index + 1}`,  // display index
            matches: groupedByRound[roundId],
        }));

        setRounds(tempRounds);

        /* console.log(stageData[0]);
        console.log(participantsData);
        console.log(matchesData);
        console.log(tempRounds); */

    };

    return (
        <>
            <Box sx={{ overflow: "auto", width: "100%", mt: 4, height: 'calc(100vh - 64px)' }}>
                <Box
                    display="flex"
                    flexDirection="row"
                    gap={6} // space between rounds 292
                    sx={{ width: 'max-content', pl: 2, pr: 6 }} // ensure enough width
                >
                    {rounds.map((round) => (
                        <Box
                            key={round.header}
                            width={250}>
                            <Box
                                sx={{
                                    bgcolor: "primary.main",
                                    color: "white",
                                    borderRadius: 1,
                                    mb: 2,
                                    width: "282px",
                                }}
                            >
                                <Typography variant="h6" align="center" sx={{ width: "100%", }}>
                                    {round.header}
                                </Typography>
                            </Box>
                            {round.matches.map((match) => {
                                const player1 = participants.find((p) => p.id === match.opponent1.id);
                                const player2 = participants.find((p) => p.id === match.opponent2.id);

                                const status = match.status; // Locked (0) > Waiting (1) > Ready (2) > Running (3) > Completed (4) > Archived (5)
                                const winnerId = match.opponent1.result === 'win' ? match.opponent1.id :
                                    match.opponent2.result === 'win' ? match.opponent2.id : null;



                                return (
                                    <Paper
                                        key={match.id}
                                        sx={{
                                            py: 2,
                                            px: 2,
                                            mb: 2,
                                            width: 250,
                                            border: '2px solid transparent',
                                            transition: 'border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease',
                                            '&:hover': {
                                                borderColor: 'primary.main',
                                                boxShadow: 3,
                                                transform: 'translateY(-1px)',
                                                cursor: 'pointer',
                                            },
                                        }}
                                        onClick={() => {
                                            // Handle match click if needed
                                            setSelectedMatch(match);
                                            setUploadModalOpen(true);
                                        }}
                                    >
                                        <Typography
                                            textAlign={'left'}
                                            sx={{
                                                display: 'flex',
                                                px: 1,
                                                py: 0.5,
                                                borderRadius: 1,
                                                backgroundColor: winnerId === match.opponent1.id ? 'primary.main' : 'transparent',
                                                color: winnerId === match.opponent1.id ? 'white' : 'inherit',
                                            }}
                                        >
                                            {player1?.name || "TBD"}
                                            <Typography
                                                variant="span"
                                                color={winnerId === match.opponent1.id ? 'white' : 'inherit'}
                                                sx={{ ml: 'auto', fontWeight: 'bold' }}
                                            >
                                                {match.scoreTeam1}
                                            </Typography>
                                        </Typography>
                                        <Divider sx={{ my: 2 }} />
                                        <Typography
                                            textAlign={'left'}
                                            sx={{
                                                display: 'flex',
                                                px: 1,
                                                py: 0.5,
                                                borderRadius: 1,
                                                backgroundColor: winnerId === match.opponent2.id ? 'primary.main' : 'transparent',
                                                color: winnerId === match.opponent2.id ? 'white' : 'inherit',
                                            }}
                                        >
                                            {player2?.name || "TBD"}
                                            <Typography
                                                variant="span"
                                                color={winnerId === match.opponent2.id ? 'white' : 'inherit'}
                                                sx={{ ml: 'auto', fontWeight: 'bold' }}
                                            >
                                                {match.scoreTeam2}
                                            </Typography>
                                        </Typography>
                                        <Chip
                                            size="small"
                                            icon={<Sports fontSize="small" />}
                                            label={status === 2 ? 'Scheduled' : status === 3 ? 'In Progress' : status === 4 ? 'Completed' : 'Pending'}
                                            color={status === 4 ? 'success' : status === 3 ? 'warning' : 'default'}
                                            variant={status === 2 ? 'outlined' : 'filled'}
                                            sx={{ alignSelf: 'flex-start', mt: 2 }}
                                        />
                                    </Paper>
                                );
                            })}
                        </Box>
                    ))}
                </Box>
            </Box >
            {adapter && selectedMatch &&
                <UploadScoreModal
                    open={uploadModalOpen}
                    adapter={adapter}
                    team1Name={participants.find(p => p.id === selectedMatch?.opponent1?.id)?.name}
                    team2Name={participants.find(p => p.id === selectedMatch?.opponent2?.id)?.name}
                    onClose={() => {
                        setUploadModalOpen(false);
                        setSelectedMatch(null);
                        fetchTournamentData();
                    }}
                    match={selectedMatch}
                />
            }
        </>
    );

};
export default RobinHoodBracket;

