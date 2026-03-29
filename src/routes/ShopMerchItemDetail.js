import { useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import {
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	Stack,
	Typography
} from "@mui/material";
import ImageCarousel from "../components/ImageCarousel";

const FALLBACK_IMAGE =
	"https://source.unsplash.com/1200x900/?padel,racket";

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
		description: "Breathable training shirt with the club crest.",
		sizeInfo: "Sizes XS to XXL",
		stock: "In stock"
	},
	{
		id: "club-cap",
		name: "Padel Hookups Cap",
		price: 18,
		image:
			"https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1200&q=80",
		description: "Lightweight cap for sunny match days.",
		sizeInfo: "One size",
		stock: "In stock"
	},
	{
		id: "club-towel",
		name: "Performance Towel",
		price: 14,
		image:
			"https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80",
		description: "Quick-dry towel made for high-intensity sessions.",
		sizeInfo: "70 x 140 cm",
		stock: "Limited stock"
	}
];

const ShopMerchItemDetail = () => {
	const navigate = useNavigate();
	const { itemId } = useParams();

	const item = useMemo(
		() => MERCH_ITEMS.find((candidate) => candidate.id === itemId),
		[itemId]
	);

	if (!item) {
		return (
			<Box sx={{ px: 2, pt: 3, pb: 10, maxWidth: 900, mx: "auto" }}>
				<Typography variant='h5' sx={{ fontWeight: 700, mb: 1 }}>
					Item not found
				</Typography>
				<Typography color='text.secondary' sx={{ mb: 2 }}>
					This merchandising item is unavailable.
				</Typography>
				<Button variant='contained' onClick={() => navigate("/Shop")}>
					Back to Shop
				</Button>
			</Box>
		);
	}

	return (
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
			<Stack
				direction={{ xs: "column", sm: "row" }}
				justifyContent='space-between'
				spacing={1.5}
				sx={{ mb: 2 }}>
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
						<Chip label='Merchandising' color='secondary' />
						<Chip label={item.sizeInfo} variant='outlined' />
						<Chip label={item.stock} variant='outlined' />
					</Stack>

					<Typography color='text.secondary'>{item.description}</Typography>

					<Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
						<Button variant='contained'>Buy</Button>
					</Stack>
				</CardContent>
			</Card>
		</Box>
	);
};

export default ShopMerchItemDetail;
