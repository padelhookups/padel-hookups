import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from "react-router";
import { useSelector } from "react-redux";

import {
  selectEvents
} from "../redux/slices/eventsSlice";

import {
    Box,
    Container,
    Tabs,
    Tab,
} from "@mui/material";

import Details from '../components/PremierPadel/Details';
import Header from '../components/PremierPadel/Header';

const BG = '#f5f4f0';
const BORDER = '#e0dbd0';

const PremierPadelMatch = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const eventId = location.state?.eventId || '';
    const match = location.state?.match || '';
    const mainColor = location.state?.mainColor || '';

    const events = useSelector(selectEvents);

    const [activeTab, setActiveTab] = useState(0);
    const [event, setEvent] = useState(null);
    const [summaryDate, setSummaryDate] = useState(null);
    const [summaryTime, setSummaryTime] = useState(null);
    const [summaryLocation, setSummaryLocation] = useState(null);

    const onBack = () => {
        // Implement navigation back to matches list
        navigate(-1);
    }

    useEffect(() => {
        // get event from redux
        setEvent(events.filter(i => i.id === eventId)[0]);
    }, [events]);

    console.log('PremierPadelMatch', match);
    

    return (
        <>
            <Header match={match} onBack={onBack} mainColor={mainColor} event={event} />
            <Box sx={{ backgroundColor: BG, }}>
                {/* Tabs */}
                <Tabs
                    value={activeTab}
                    onChange={(_, v) => setActiveTab(v)}
                    variant="fullWidth"
                    sx={{
                        color: mainColor,
                        bgcolor: 'white',
                        position: 'sticky',
                        top: 0,
                        zIndex: 10,
                        borderBottom: `1px solid ${BORDER}`,
                        '& .MuiTab-root': { fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: '#888', fontFamily: 'Barlow, sans-serif' },
                        '& .Mui-selected': { color: mainColor },
                        '& .MuiTabs-indicator': { bgcolor: mainColor },
                    }}
                >
                    <Tab label="Summary" />
                    <Tab label="Schedule" />
                    <Tab label="Results" />
                </Tabs>

                <Container maxWidth="sm">
                    <Box>
                        {activeTab === 0 && (
                            <Details match={match} event={event} summaryDate={summaryDate} summaryTime={summaryTime} summaryLocation={summaryLocation} mainColor={mainColor} />
                        )}
                        {activeTab === 1 && (
                            {/* <ScheduleTab
                        match={match}
                        currentTeamId={currentTeamId}
                        onConfirmed={(date, time) => { setSummaryDate(date); setSummaryTime(time); setSummaryLocation('Court TBD'); }}
                        onLocationUpdated={(loc) => setSummaryLocation(loc)}
                    /> */}
                        )}
                        {/* {activeTab === 2 && <ResultsTab />} */}
                    </Box>
                </Container>

            </Box>
        </>
    );
}

export default PremierPadelMatch;
