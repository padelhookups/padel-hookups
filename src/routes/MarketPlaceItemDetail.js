import { useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import {
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	Divider,
	Stack,
	Typography
} from "@mui/material";
import Header from "../components/Header";
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
			"Power-focused racket with very low scratches and fresh overgrip.",
		seller: "Ana R.",
		postedAt: "2 days ago"
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
			"Size EU 43. Great grip left and right, ideal for quick court movements.",
		seller: "Marco T.",
		postedAt: "5 days ago"
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
			"Thermal compartment and separate shoe pocket. Clean and ready to use.",
		seller: "Lidia M.",
		postedAt: "1 week ago"
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
			"Sealed 24-can pack, tournament feel and stable bounce.",
		seller: "Pablo V.",
		postedAt: "Today"
	}
];

const MarketPlaceItemDetail = () => {
	const navigate = useNavigate();
	const { itemId } = useParams();

	const item = useMemo(
		() => MARKET_ITEMS.find((candidate) => candidate.id === itemId),
		[itemId]
	);

	if (!item) {
		return (
			<>
				{/* <Header /> */}
				<Box sx={{ px: 2, pt: 3, pb: 10, maxWidth: 900, mx: "auto" }}>
					<Typography variant='h5' sx={{ fontWeight: 700, mb: 1 }}>
						Item not found
					</Typography>
					<Typography color='text.secondary' sx={{ mb: 2 }}>
						The listing may have been removed or is unavailable.
					</Typography>
					<Button variant='contained' onClick={() => navigate("/Shop")}>
						Back to Shop
					</Button>
				</Box>
			</>
		);
	}

	return (
		<>
			{/* <Header /> */}
			<Box
				sx={{
					px: 2,
					pt: 3,
					pb: 11,
					maxWidth: 900,
					mx: "auto",
					height: "calc(100vh - 124px)",
					overflowY: "auto",
					WebkitOverflowScrolling: "touch"
				}}>
			<Stack direction={{ xs: "column", sm: "row" }} justifyContent='space-between' spacing={1.5} sx={{ mb: 2 }}>
				<Typography variant='h4' sx={{ fontWeight: 700 }}>
					{item.name}
				</Typography>
				<Typography variant='h5' sx={{ fontWeight: 700 }}>
					${item.price}
				</Typography>
			</Stack>

			<Card variant='outlined' sx={{ borderRadius: 2 }}>
				<ImageCarousel
					images={item.images || [item.image]}
					alt={item.name}
					height={280}
					fallbackImage={FALLBACK_IMAGE}
					fit='contain'
				/>
				<CardContent sx={{ display: "grid", gap: 2 }}>
					<Stack direction='row' spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
						<Chip label={item.category} color='secondary' />
						<Chip label={item.condition} variant='outlined' />
						<Chip label={item.city} variant='outlined' />
					</Stack>

					<Typography color='text.secondary'>{item.description}</Typography>

					<Divider />

					<Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
						<Typography>
							<Typography component='span' sx={{ fontWeight: 600 }}>
								Seller: 
							</Typography>
							{item.seller}
						</Typography>
						<Typography>
							<Typography component='span' sx={{ fontWeight: 600 }}>
								Listed: 
							</Typography>
							{item.postedAt}
						</Typography>
					</Stack>

					<Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
						<Button variant='contained'>Buy</Button>
					</Stack>
				</CardContent>
			</Card>
			</Box>
		</>
	);
};

export default MarketPlaceItemDetail;
