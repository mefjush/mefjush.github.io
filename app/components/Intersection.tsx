"use client"

import { useState, useEffect, useLayoutEffect } from 'react'
import LightComponent from './Light'
import Clock from '../domain/Clock'
import TrafficLight from '../domain/TrafficLight'
import LightConfig, { LightSettings, DEFAULT_LIGHT_SETTINGS } from '../domain/LightConfig'
import Failure from '../domain/Failure'
import { Fab, Stack, Box, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { LightSettingsParser, IntersectionSettingsParser } from '../url'
import IntersectionSettings, { DEFAULT_INTERSECTION_SETTINGS } from '../domain/IntersectionSettings'
import Fullscreen from './Fullscreen'
import LightHead from './LightHead'
import React from 'react'
import ShareDialog from './ShareDialog'
import timeSync from '../domain/timeSync'
import LightDetails from './LightDetails'
import LightUiState from '../domain/LightUiState'
import { createParser, Options, parseAsInteger, useQueryState } from 'nuqs'
import IntersectionSettingsPanel from './IntersectionSettingsPanel'
import LightGroup from './LightGroup'
import { light } from '@mui/material/styles/createPalette'

export type UiMode = 'none' | 'share' | 'fullscreen'
export type SelectionMode = 'none' | 'some' | 'all' | 'set-all' | 'set-none'

const historyPush: Options = { history: 'push' }

// TODOs
// Offline usage
// Description / about page
// Manual time correction in cookie / local storage
// blink & beep
// better sharing (share all? swipe on fullscreen?)
// fix the timeline range slider on edge (when expanding)
// breadcrumbs

export default function IntersectionComponent({ 
  uiMode, 
  setUiMode, 
}: { 
  uiMode: UiMode,
  setUiMode: (uiMode: UiMode) => void, 
}) {

  const [intersectionSettings, setIntersectionSettings] = useQueryState(
    "intersection", 
    createParser(IntersectionSettingsParser).withDefault(DEFAULT_INTERSECTION_SETTINGS)
  )

  const [lightSettings, setLightSettings] = useQueryState(
    "lights", 
    createParser(LightSettingsParser).withDefault([DEFAULT_LIGHT_SETTINGS])
  )

  const [expanded, setExpanded] = useQueryState("e", parseAsInteger.withOptions(historyPush))

  const [timeCorrection, setTimeCorrection] = useState(0)

  const [currentTimestamp, setCurrentTimestamp] = useState(Date.now())

  const [selected, setSelected] = useState<number[]>([])

  const effectivelySelected = selected.length == 0 ? lightSettings.map((ls, index) => index) : selected

  const [lightUiStates, setLightUiStates] = useState(lightSettings.map(ls => new LightUiState(ls.phases[0].state)))

  const failure = new Failure(intersectionSettings.failure.duration, intersectionSettings.failure.probability)

  const hasFailed = failure.currentState(currentTimestamp)

  const lightConfigs = lightSettings.map(lightSetting => new LightConfig(intersectionSettings, lightSetting))

  const lights = lightConfigs.map(lightConfig => new TrafficLight(lightConfig, hasFailed))

  const groups = lightConfigs.map((lightConfig, index) => ([{ 
    light: lights[index],
    lightConfig: lightConfigs[index],
    expanded: index === expanded,
    onLightSettingsChange: (settings: LightSettings) => updateLightSettings(settings, index),
    setExpanded: () => setExpanded(index)
  }]))

  const clock = new Clock(timeCorrection)
  
  const updateLightSettings = (settings: LightSettings, index: number) => {
    const copy = [...lightSettings]
    copy.splice(index, 1, settings)
    setLightSettings(copy)
    setCurrentTimestamp(clock.now())
  }

  const updateLightUiState = (lightUiState: LightUiState, index: number) => {
    const copy = [...lightUiStates]
    copy.splice(index, 1, lightUiState)
    setLightUiStates(copy)
  }

  const wrapListener = {
    nextStateTimestamp: (timestamp: number) => (Math.floor(timestamp / intersectionSettings.cycleLength) + 1) * intersectionSettings.cycleLength
  }

  const enterUiMode = (idx: number, uiMode: UiMode) => {
    setSelected([idx])
    setUiMode(uiMode)
  }

  const exitUiMode = () => {
    setUiMode('none')
    setSelected([])
  }

  const enterFullscreenMode = (idx: number) => {
    enterUiMode(idx, 'fullscreen')
  }

  const enterShareMode = (idx: number) => {
    enterUiMode(idx, 'share')
  }

  const initTimeSync = () => timeSync()
    .then(correction => setTimeCorrection(correction))
    .catch(e => setTimeCorrection(0))

  const updateIntersectionSettings = (intersectionSettings: IntersectionSettings) => {
    setIntersectionSettings(intersectionSettings)
    setCurrentTimestamp(clock.now())
  }

  const onAdd = () => {
    setLightSettings([...lightSettings, DEFAULT_LIGHT_SETTINGS])
    setLightUiStates([...lightUiStates, new LightUiState(DEFAULT_LIGHT_SETTINGS.phases[0].state)])
    setUiMode('none')
    setExpanded(lightSettings.length)
  }

  const onDelete = (indicesToDelete: number[]) => {
    setLightSettings([...lightSettings].filter((ls, i) => !indicesToDelete.includes(i)))
    setLightUiStates([...lightUiStates].filter((ui, i) => !indicesToDelete.includes(i)))
    setUiMode('none')
  }

  const getShareUrl = () => {
    
    const selectedLightSettings = lightSettings.filter((ls, index) => effectivelySelected.includes(index))

    const search = `?intersection=${IntersectionSettingsParser.serialize(intersectionSettings)}&lights=${LightSettingsParser.serialize(selectedLightSettings)}`

    const baseUrl = typeof window === "undefined" ? process.env.NEXT_PUBLIC_SITE_URL : window.location.origin

    return baseUrl + '/intersection' + search
  }  

  const fullscreenContents = () => {
    const fullscreenLights = lights.filter((light, index) => effectivelySelected.includes(index))

    return fullscreenLights.map((light, index) => (
      <LightHead key={`fullscreen-light-${index}`} currentTimestamp={currentTimestamp} light={light} lightConfig={light.lightConfig} maxHeight={100} maxWidth={100}/>
    ))
  }

  // once
  useEffect(() => {
    initTimeSync()
  }, [])

  // after each render
  useEffect(() => {
    clock.register([...lights, failure, wrapListener]).then(setCurrentTimestamp)
    return () => {
      clock.unregister()
    }
  })

  const intersectionLights = lights.map((light, index) =>
    <LightComponent
      key={index}
      currentTimestamp={currentTimestamp}
      light={light}
      lightConfig={lightConfigs[index]}
      expanded={index === expanded}
      lightUiState={lightUiStates[index]}
      onLightSettingsChange={(settings: LightSettings) => updateLightSettings(settings, index)}
      setExpanded={() => setExpanded(index)}
      onDelete={() => onDelete([index])}
      onFullscreen={() => enterFullscreenMode(index)}
      onShare={() => enterShareMode(index)}
      setLightUiState={(lightUiState: LightUiState) => updateLightUiState(lightUiState, index)}
    />
  )

  const intersectionGroups = groups.map((group, index) => (
    <LightGroup
      key={index}
      currentTimestamp={currentTimestamp}
      lightUiState={lightUiStates[index]}
      setLightUiState={(lightUiState: LightUiState) => updateLightUiState(lightUiState, index)}
      onDelete={() => onDelete([index])}
      onFullscreen={() => enterFullscreenMode(index)}
      onShare={() => enterShareMode(index)}
      lightRecords={group}
    />
  ))

  return (
    <Stack spacing={2} sx={{ p: 1, m: 1 }}>
   
      <Typography variant='h6'>Settings</Typography>
      
      <IntersectionSettingsPanel
        intersectionSettings={intersectionSettings}
        updateIntersectionSettings={updateIntersectionSettings}
        timeCorrection={timeCorrection}
        setTimeCorrection={setTimeCorrection}
        initTimeSync={initTimeSync}
      />

      <Typography variant='h6'>Traffic Lights</Typography>
  
      {/* {intersectionLights} */}
      {intersectionGroups}

      <Fullscreen
        enabled={uiMode == 'fullscreen'}
        onDisabled={exitUiMode}
      >
        {fullscreenContents()}
      </Fullscreen>

      <ShareDialog
        url={getShareUrl()}
        open={uiMode == 'share'}
        onClose={exitUiMode}
      />

      {expanded != null &&
        <LightDetails
          open={expanded != null}
          currentTimestamp={currentTimestamp}
          light={lights[expanded]}
          lightConfig={lightConfigs[expanded]}
          lightUiState={lightUiStates[expanded]}
          onClose={() => setExpanded(null)}
          onLightSettingsChange={(settings: LightSettings) => updateLightSettings(settings, expanded)}
          onFullscreen={() => enterFullscreenMode(expanded)}
          onShare={() => enterShareMode(expanded)}
          setLightUiState={(lightUiState: LightUiState) => updateLightUiState(lightUiState, expanded)}
        />
      }

      <Fab 
        color="primary" 
        aria-label="add" 
        onClick={onAdd} 
        style={{ margin: 0, top: 'auto', right: 20, bottom: 20, left: 'auto', position: 'fixed' }}
      >
        <AddIcon />
      </Fab>
    </Stack>
  )
}
