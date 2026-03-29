import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	Grid,
	InputAdornment,
	Paper,
	Stack,
	Tab,
	TextField,
	Typography,
	Divider
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import Header from "../components/Header";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import ImageCarousel from "../components/ImageCarousel";

const FALLBACK_IMAGE =
	"https://source.unsplash.com/1200x900/?padel,racket";

const BULLPADEL_RACKET_IMAGE =
	"https://thf.bing.com/th?id=OPEC.FMRtmmqc6gr%2bcw474C474&w=140&h=200&pcl=f5f5f5&r=0&o=2&pid=21.1";

const MARKET_ITEMS = [
	{
		id: "racket-bullpadel-vertex-04",
		name: "Bullpadel Vertex 04",
		price: 189,
		image: BULLPADEL_RACKET_IMAGE,
		images: [
			BULLPADEL_RACKET_IMAGE,
			"https://images.unsplash.com/photo-1595435934011-0af4c901acc0?auto=format&fit=crop&w=1200&q=80",
			"https://images.unsplash.com/photo-1624196897742-5f0f0d1d5f8e?auto=format&fit=crop&w=1200&q=80"
		],
		condition: "Used - Excellent",
		city: "Barcelona",
		category: "Racket",
		description:
			"Power-focused racket with very low scratches and fresh overgrip."
	},
	{
		id: "shoes-asics-gel-resolution-9",
		name: "Asics Gel Resolution 9",
		price: 78,
		image:
			"https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80",
		condition: "Used - Good",
		city: "Madrid",
		category: "Shoes",
		description:
			"Size EU 43. Great grip left and right, ideal for quick court movements."
	},
	{
		id: "bag-head-pro-x-duffle",
		name: "Head Pro X Duffle",
		price: 52,
		image:
			"https://images.unsplash.com/photo-1547949003-9792a18a2601?auto=format&fit=crop&w=1200&q=80",
		condition: "Used - Very Good",
		city: "Valencia",
		category: "Bag",
		description:
			"Thermal compartment and separate shoe pocket. Clean and ready to use."
	},
	{
		id: "balls-wilson-x3-box",
		name: "Wilson X3 Ball Box",
		price: 22,
		image:
			"https://images.unsplash.com/photo-1611903292609-bdbaa4439b6f?auto=format&fit=crop&w=1200&q=80",
		condition: "New",
		city: "Sevilla",
		category: "Balls",
		description:
			"Sealed 24-can pack, tournament feel and stable bounce."
	}
];

const MERCH_ITEMS = [
	{
		id: "club-shirt-2026",
		name: "Club Shirt 2026",
		price: 29,
		image:
			"https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80",
		images: [
			"https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80",
			"https://images.unsplash.com/photo-1618354691438-25bc04584c23?auto=format&fit=crop&w=1200&q=80",
			"https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1200&q=80"
		],
		description: "Breathable training shirt with the club crest."
	},
	{
		id: "club-cap",
		name: "Padel Hookups Cap",
		price: 18,
		image:
			"https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1200&q=80",
		description: "Lightweight cap for sunny match days."
	},
	{
		id: "club-towel",
		name: "Performance Towel",
		price: 14,
		image:
			"https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80",
		description: "Quick-dry towel made for high-intensity sessions."
	}
];

const MarketPlace = () => {
	const navigate = useNavigate();
	const [query, setQuery] = useState("");
	const [tabValue, setTabValue] = useState("marktplace");

	const visibleItems = useMemo(() => {
		const normalized = query.trim().toLowerCase();
		if (!normalized) return MARKET_ITEMS;

		return MARKET_ITEMS.filter((item) => {
			const searchTarget = `${item.name} ${item.category} ${item.city} ${item.condition}`.toLowerCase();
			return searchTarget.includes(normalized);
		});
	}, [query]);

	return (
		<>
			{/* <Header /> */}
			<Box
				sx={{
					px: 2,
					pt: 2,
					pb: 11,
					maxWidth: 1080,
					mx: "auto",
					height: "calc(100vh - 124px)",
					overflowY: "auto",
					WebkitOverflowScrolling: "touch"
				}}>
			<Paper elevation={0} sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
				<TabContext value={tabValue}>
					<TabList
						onChange={(_, newValue) => setTabValue(newValue)}
						variant='fullWidth'
						sx={{
							"& .MuiTab-root": { fontWeight: 700, textTransform: "none" },
							"& .MuiTabs-indicator": { height: 3 }
						}}>
						<Tab value='merchandising' label='Merchandising' />
						<Tab value='marktplace' label='Marktplace' />
					</TabList>
					<Divider />

					<TabPanel value='merchandising' sx={{ p: 2 }}>
						<Typography variant='h5' sx={{ fontWeight: 700, mb: 1 }}>
							Club Merchandising
						</Typography>
						<Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
							Official gear for training and tournaments.
						</Typography>

						<Grid container spacing={2}>
							{MERCH_ITEMS.map((item) => (
								<Grid key={item.id} size={{ xs: 12, sm: 6, md: 4 }}>
									<Card variant='outlined' sx={{ borderRadius: 2, height: "100%" }}>
										<ImageCarousel
											images={item.images || [item.image]}
											alt={item.name}
											height={180}
											fallbackImage={FALLBACK_IMAGE}
											fit='contain'
										/>
										<CardContent>
											<Typography variant='h6' sx={{ fontWeight: 700 }}>
												{item.name}
											</Typography>
											<Typography variant='body2' color='text.secondary' sx={{ mb: 1.25 }}>
												{item.description}
											</Typography>
											<Typography variant='h6' sx={{ fontWeight: 700 }}>
												${item.price}
											</Typography>
											<Button
												variant='contained'
												sx={{ mt: 1.25 }}
												onClick={() => navigate(`/Shop/merch/${item.id}`)}>
												View Details
											</Button>
										</CardContent>
									</Card>
								</Grid>
							))}
						</Grid>
					</TabPanel>

					<TabPanel value='marktplace' sx={{ p: 2 }}>
						<Stack spacing={1.5} sx={{ mb: 2.5 }}>
							<Typography variant='h5' sx={{ fontWeight: 700 }}>
								Community Marktplace
							</Typography>
							<Typography variant='body2' color='text.secondary'>
								Buy and sell padel gear from the community.
							</Typography>
							<TextField
								fullWidth
								placeholder='Search by item, category, city...'
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								InputProps={{
									startAdornment: (
										<InputAdornment position='start'>
											<SearchIcon fontSize='small' />
										</InputAdornment>
									)
								}}
							/>
						</Stack>

						<Grid container spacing={2}>
							{visibleItems.map((item) => (
								<Grid key={item.id} size={{ xs: 12, md: 6 }}>
									<Card
										variant='outlined'
										sx={{
											height: "100%",
											display: "flex",
											flexDirection: "column",
											borderRadius: 2
										}}>
										<ImageCarousel
											images={item.images || [item.image]}
											alt={item.name}
											height={190}
											fallbackImage={FALLBACK_IMAGE}
											fit='contain'
										/>
										<CardContent sx={{ display: "grid", gap: 1.25 }}>
											<Stack direction='row' justifyContent='space-between' alignItems='center'>
												<Chip size='small' label={item.category} color='secondary' />
												<Typography variant='h6' sx={{ fontWeight: 700 }}>
													${item.price}
												</Typography>
											</Stack>

											<Typography variant='h6' sx={{ fontWeight: 600 }}>
												{item.name}
											</Typography>

											<Typography variant='body2' color='text.secondary'>
												{item.description}
											</Typography>

											<Stack direction='row' spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
												<Chip size='small' variant='outlined' label={item.condition} />
												<Chip size='small' variant='outlined' label={item.city} />
											</Stack>

											<Button
												variant='contained'
												onClick={() => navigate(`/Shop/item/${item.id}`)}>
												View Details
											</Button>
										</CardContent>
									</Card>
								</Grid>
							))}
						</Grid>

						{visibleItems.length === 0 && (
							<Typography sx={{ mt: 3 }} color='text.secondary'>
								No items found for "{query}".
							</Typography>
						)}
					</TabPanel>
				</TabContext>
			</Paper>
			</Box>
		</>
	);
};

export default MarketPlace;
