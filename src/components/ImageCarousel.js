import { useMemo, useState } from "react";
import { Box, IconButton, Stack } from "@mui/material";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";

const ImageCarousel = ({
	images,
	alt,
	height = 280,
	fallbackImage,
	fit = "contain"
}) => {
	const normalizedImages = useMemo(() => {
		if (!Array.isArray(images)) return [];
		return images.filter(Boolean);
	}, [images]);

	const [activeIndex, setActiveIndex] = useState(0);

	if (normalizedImages.length === 0 && !fallbackImage) return null;

	const safeIndex = Math.min(activeIndex, Math.max(normalizedImages.length - 1, 0));
	const currentImage = normalizedImages[safeIndex] || fallbackImage;
	const canNavigate = normalizedImages.length > 1;

	const onPrev = () => {
		setActiveIndex((prev) =>
			prev === 0 ? normalizedImages.length - 1 : prev - 1
		);
	};

	const onNext = () => {
		setActiveIndex((prev) =>
			prev === normalizedImages.length - 1 ? 0 : prev + 1
		);
	};

	const onError = (event) => {
		if (fallbackImage) {
			event.currentTarget.src = fallbackImage;
		}
	};

	return (
		<Box
			sx={{
				position: "relative",
				height,
				bgcolor: "grey.100",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				overflow: "hidden"
			}}>
			<Box
				component='img'
				src={currentImage}
				alt={alt}
				onError={onError}
				sx={{
					width: "100%",
					height: "100%",
					objectFit: fit,
					p: 1
				}}
			/>

			{canNavigate && (
				<>
					<IconButton
						size='small'
						onClick={onPrev}
						sx={{
							position: "absolute",
							left: 8,
							bgcolor: "rgba(0, 0, 0, 0.45)",
							color: "common.white",
							"&:hover": { bgcolor: "rgba(0, 0, 0, 0.6)" }
						}}>
						<ChevronLeft fontSize='small' />
					</IconButton>
					<IconButton
						size='small'
						onClick={onNext}
						sx={{
							position: "absolute",
							right: 8,
							bgcolor: "rgba(0, 0, 0, 0.45)",
							color: "common.white",
							"&:hover": { bgcolor: "rgba(0, 0, 0, 0.6)" }
						}}>
						<ChevronRight fontSize='small' />
					</IconButton>
				</>
			)}

			{canNavigate && (
				<Stack
					direction='row'
					spacing={0.75}
					sx={{
						position: "absolute",
						bottom: 8,
						left: "50%",
						transform: "translateX(-50%)"
					}}>
					{normalizedImages.map((_, index) => (
						<Box
							key={`dot-${index}`}
							sx={{
								width: 7,
								height: 7,
								borderRadius: "50%",
								bgcolor:
									index === safeIndex
										? "common.white"
										: "rgba(255,255,255,0.45)"
							}}
						/>
					))}
				</Stack>
			)}
		</Box>
	);
};

export default ImageCarousel;
