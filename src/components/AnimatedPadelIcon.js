import React from "react";
import { Box } from "@mui/material";

const AnimatedPadelIcon = ({ 
	size = 100, 
	animationDuration = "2s",
	showImpactEffect = true,
	containerSx = {} 
}) => {
	return (
		<>
			<Box
				sx={{
					position: "relative",
					width: `${size}px`,
					height: `${size}px`,
					animation: "fadeInScale 0.8s ease-out",
					...containerSx
				}}>
				{/* Animated Padel Racket */}
				<Box
					sx={{
						position: "absolute",
						width: `${size * 0.6}px`,
						height: `${size * 0.8}px`,
						left: "50%",
						top: "50%",
						transform: "translate(-50%, -50%)",
						transformOrigin: "center bottom",
						animation: `racketSwing ${animationDuration} ease-in-out infinite`
					}}>
					{/* Racket Head - Proper Teardrop Padel Racket */}
					<Box
						sx={{
							width: `${size * 0.4}px`,
							height: `${size * 0.5}px`,
							position: "relative",
							margin: "0 auto"
						}}>
						{/* SVG Teardrop Shape */}
						<svg
							width={size * 0.36}
							height={size * 0.46}
							viewBox='0 0 36 46'
							style={{
								position: "absolute",
								top: 0,
								left: "50%",
								transform: "translateX(-50%)"
							}}>
							<path
								d='M18 2 C6 2, 2 12, 2 20 C2 28, 6 36, 12 40 L18 44 L24 40 C30 36, 34 28, 34 20 C34 12, 30 2, 18 2 Z'
								fill='rgba(254, 243, 199, 0.95)'
								stroke='#b88f34'
								strokeWidth='3'
							/>
						</svg>

						{/* Padel Racket Holes Pattern */}
						{[...Array(25)].map((_, i) => {
							const row = Math.floor(i / 5);
							const col = i % 5;
							// Adjust hole positions to fit teardrop shape
							const yPos = 8 + row * 5;
							const baseX = 8;
							let xOffset = 0;

							// Narrow the pattern as we go down (teardrop effect)
							if (row > 2) xOffset = (row - 2) * 2;
							if (row > 4) xOffset = (row - 2) * 4;

							const xPos = baseX + col * 5 + xOffset;
							const isVisible = row < 6 && xPos >= 8 && xPos <= 28;

							if (!isVisible) return null;

							return (
								<Box
									key={i}
									sx={{
										position: "absolute",
										width: "2.5px",
										height: "2.5px",
										bgcolor: "#b88f34",
										borderRadius: "50%",
										top: `${yPos}px`,
										left: `${xPos}px`,
										opacity: 0.7
									}}
								/>
							);
						})}
					</Box>
					{/* Racket Handle */}
					<Box
						sx={{
							width: `${size * 0.06}px`,
							height: `${size * 0.3}px`,
							bgcolor: "#8b5a2b",
							borderRadius: "3px",
							margin: "0 auto",
							position: "relative"
						}}>
						{/* Handle Grip Lines */}
						{[...Array(4)].map((_, i) => (
							<Box
								key={i}
								sx={{
									position: "absolute",
									width: "100%",
									height: "1px",
									bgcolor: "#654321",
									top: `${5 + i * 6}px`,
									opacity: 0.7
								}}
							/>
						))}
					</Box>
				</Box>

				{/* Animated Padel Ball */}
				<Box
					sx={{
						position: "absolute",
						width: `${size * 0.16}px`,
						height: `${size * 0.16}px`,
						borderRadius: "50%",
						bgcolor: "#facc15",
						border: "1px solid #eab308",
						left: "50%",
						top: "30%",
						transform: "translate(-50%, -50%)",
						animation: `ballBounce ${animationDuration} ease-in-out infinite`,
						boxShadow: "inset 2px -2px 4px rgba(234, 179, 8, 0.3)"
					}}>
					{/* Ball Seam Lines */}
					<Box
						sx={{
							position: "absolute",
							width: `${size * 0.12}px`,
							height: "1px",
							bgcolor: "white",
							borderRadius: "50px",
							top: `${size * 0.04}px`,
							left: `${size * 0.02}px`,
							transform: "rotate(-20deg)",
							opacity: 0.9
						}}
					/>
					<Box
						sx={{
							position: "absolute",
							width: `${size * 0.12}px`,
							height: "1px",
							bgcolor: "white",
							borderRadius: "50px",
							top: `${size * 0.1}px`,
							left: `${size * 0.02}px`,
							transform: "rotate(20deg)",
							opacity: 0.9
						}}
					/>
				</Box>

				{/* Impact Effect */}
				{showImpactEffect && (
					<Box
						sx={{
							position: "absolute",
							width: `${size * 0.2}px`,
							height: `${size * 0.2}px`,
							borderRadius: "50%",
							border: "2px solid #facc15",
							left: "50%",
							top: "30%",
							transform: "translate(-50%, -50%)",
							animation: `impactPulse ${animationDuration} ease-in-out infinite`,
							opacity: 0
						}}
					/>
				)}
			</Box>

			{/* CSS Animation Styles */}
			<style>
				{`
					@keyframes fadeInScale {
						0% {
							opacity: 0;
							transform: scale(0.5);
						}
						100% {
							opacity: 1;
							transform: scale(1);
						}
					}

					@keyframes racketSwing {
						0% { transform: translate(-50%, -50%) rotate(-15deg); }
						20% { transform: translate(-50%, -50%) rotate(-25deg); }
						40% { transform: translate(-50%, -50%) rotate(10deg); }
						60% { transform: translate(-50%, -50%) rotate(-5deg); }
						100% { transform: translate(-50%, -50%) rotate(-15deg); }
					}

					@keyframes ballBounce {
						0% { transform: translate(-50%, -50%) translateX(0px) translateY(0px); }
						20% { transform: translate(-50%, -50%) translateX(-15px) translateY(-10px); }
						40% { transform: translate(-50%, -50%) translateX(25px) translateY(-20px); }
						60% { transform: translate(-50%, -50%) translateX(15px) translateY(5px); }
						80% { transform: translate(-50%, -50%) translateX(-5px) translateY(-5px); }
						100% { transform: translate(-50%, -50%) translateX(0px) translateY(0px); }
					}

					@keyframes impactPulse {
						0% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
						35% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
						40% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.2); }
						45% { opacity: 0.4; transform: translate(-50%, -50%) scale(1.8); }
						50% { opacity: 0; transform: translate(-50%, -50%) scale(2.5); }
						100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
					}
				`}
			</style>
		</>
	);
};

export default AnimatedPadelIcon;
