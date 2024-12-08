"use client"

import LightConfig, { LightSettings } from '../domain/LightConfig'
import { Typography } from '@mui/material'
import PhaseControls from './PhaseControls'
import React from 'react'
import { State } from '../domain/State'
import Grid from '@mui/material/Grid2'

export default function LightSettingsComponent({ lightConfig, onLightSettingsChange, setSelectedState, selectedState }: { lightConfig: LightConfig, onLightSettingsChange: (lightSettings: LightSettings) => void, setSelectedState: (state: State) => void, selectedState?: State }) {

  const quickEditControls = (
    <PhaseControls
      lightConfig={lightConfig}
      onLightSettingsChange={onLightSettingsChange}
      setSelectedState={setSelectedState}
      selectedState={selectedState}
      expanded={true}
    />
  )

  return (
    <Grid container spacing={2}>
      <Grid size={{xs: 12, md: 4, lg: 3}}>
        <Typography gutterBottom>
          Phases
        </Typography>
        {quickEditControls}
      </Grid>
    </Grid>
  )
}