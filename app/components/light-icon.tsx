"use client"

import TrafficLight from '../domain/traffic-light'
import { Stack, Avatar, AvatarProps, IconProps } from '@mui/material'
import { styled, alpha, Palette, PaletteColor } from "@mui/material/styles"
import { SegmentColor } from '../domain/state'
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun'
import CircleIcon from '@mui/icons-material/Circle';
import ForkLeftIcon from '@mui/icons-material/ForkLeft';

const TRANSITION_DURATION = '300ms'

const StyledAvatar = styled(Avatar)<AvatarProps>(
  ({ theme, color, prefix }) => {
    const alphaCenter = prefix == 'on' ? 1 : 0.3
    const alphaEdge = prefix == 'on' ? 0.2 : 0.05
    const gradientEnd = prefix == 'on' ? 80 : 100
    const opacity = prefix == 'on' ? 1 : 0.4

    const paletteColor = (theme.palette[color as keyof Palette]) as PaletteColor
    const backgroundCenter = alpha(paletteColor.main, alphaCenter)
    const backgroundEdge = alpha(paletteColor.dark, alphaEdge)

    return {
      background: `radial-gradient(circle, ${backgroundCenter} 60%, ${backgroundEdge} ${gradientEnd}%)`,
      transitionDuration: TRANSITION_DURATION,
      opacity: opacity
    }
  }
)

const StyledImgAvatar = styled(Avatar)<AvatarProps>(
  ({ theme, color, prefix }) => {
    const alphaCenter = prefix == 'on' ? 0.15 : 0.15
    const alphaEdge = prefix == 'on' ? 0.2 : 0.05
    const gradientEnd = prefix == 'on' ? 80 : 100
    const opacity = prefix == 'on' ? 1 : 0.4

    const paletteColor = (theme.palette[color as keyof Palette]) as PaletteColor
    const backgroundCenter = alpha(paletteColor.main, alphaCenter)
    const backgroundEdge = alpha(paletteColor.dark, alphaEdge)

    return {
      background: `radial-gradient(circle, ${backgroundCenter} 60%, ${backgroundEdge} ${gradientEnd}%)`,
      transitionDuration: TRANSITION_DURATION,
      opacity: opacity
    }
  }
)

export default function LightIcon({ currentTimestamp, light, height }: { currentTimestamp: number, light: TrafficLight, height: string }) {

  const segments: SegmentColor[] = ['tlRed', 'tlYellow', 'tlGreen']

  const currentPhase = light.currentPhase(currentTimestamp)

  const heightValue = Number.parseInt(height.substring(0, height.length - 2))
  const heightUnit = height.substring(height.length - 2, height.length)
  const segmentSize = 0.8 * heightValue / (segments.length)

  const isImg = false

  const imgScale = 0.7

  const segmentStates = segments.map(segment => {
    const on = currentPhase.stateAttributes().segments.includes(segment)

    if (isImg) {
      return (
        <StyledImgAvatar 
          prefix={on ? 'on' : 'off'} 
          color={segment}
          key={segment} 
          sx={{ 
            width: `${segmentSize}${heightUnit}`, 
            height: `${segmentSize}${heightUnit}`,
            border: `${0.015 * segmentSize}${heightUnit} solid black`
          }}
        >
          <ForkLeftIcon sx={{ width: `${imgScale * segmentSize}${heightUnit}`, height: `${imgScale * segmentSize}${heightUnit}`, color: `${segment}.main`, opacity: on ? 1 : 0.1 }} />
        </StyledImgAvatar>
      )
    } else {
      return (
        <StyledAvatar 
          prefix={on ? 'on' : 'off'} 
          color={segment}
          key={segment} 
          sx={{ 
            width: `${segmentSize}${heightUnit}`, 
            height: `${segmentSize}${heightUnit}`,
            border: `${0.015 * segmentSize}${heightUnit} solid black`
          }}
        > </StyledAvatar>
      )
    }
  })

  return (
    <Stack 
      direction='column' 
      spacing={`${Math.round(heightValue * 0.01)}${heightUnit}`} 
      sx={{ 
        padding: `${Math.round(heightValue * 0.06)}${heightUnit}`, 
        borderRadius: `${Math.round(heightValue * 0.1)}${heightUnit}`, 
        border: `${0.015 * segmentSize}${heightUnit} solid black`,
        transitionDuration: TRANSITION_DURATION,
        backgroundColor: '#131313',
        boxShadow: 3
      }}
      justifyContent="center"
      alignItems="center"
    >
      {segmentStates}
    </Stack>
  )
}