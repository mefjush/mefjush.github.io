"use client"

import { Box, Button, Snackbar, Stack } from '@mui/material'
import Grid from '@mui/material/Grid2'
import React, { ReactElement, useEffect, useRef, useState } from 'react'
import useWindowSize from '../hooks/useWindowSize'

export default function Fullscreen({ 
  enabled, 
  children, 
  onDisabled 
}: { 
  enabled: boolean, 
  children: ReactElement[], 
  onDisabled: () => void 
}) {

  const fullscreenRef = useRef<HTMLDivElement>(null)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)
  const [invisibleChildren, setInvisibleChildren] = useState<number[]>([])
  const [snackbarUndo, setSnackbarUndo] = useState<number|null>(null)
  const [windowWidth, windowHeight] = useWindowSize()

  // once
  useEffect(() => {
    document.addEventListener("fullscreenchange", (event) => {
      if (!document.fullscreenElement) {
        releaseWakeLock()
        onDisabled()
      } else {
        requestWakeLock()
      }
    })
  }, [])

  useEffect(() => {
    setInvisibleChildren([])
    setSnackbarUndo(null)
    if (enabled) {
      fullscreenRef.current?.requestFullscreen({ navigationUI: 'hide' })
    }
  }, [enabled])

  const requestWakeLock = async () => {
    try {
      if (navigator && navigator.wakeLock) {
        wakeLockRef.current = await navigator.wakeLock.request()
      }
    } catch (err: any) {
      console.error(`${err.name}, ${err.message}`)
    }
  }

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      try {
        wakeLockRef.current.release().then(() => {
          wakeLockRef.current = null
        })
      } catch (err: any) {
        console.error(`${err.name}, ${err.message}`)
      }
    }
  }

  const action = (
    <>
      <Button color="secondary" size="small" onClick={() => {
        setInvisibleChildren(invisibleChildren.filter(i => i != snackbarUndo))
        setSnackbarUndo(null)
      }}>
        UNDO
      </Button>
    </>
  )

  const heightConstrainedSize = windowHeight
  const widthConstrainedSize = windowWidth / (children.length - invisibleChildren.length)

  const onClick = (index: number) => {
    if (invisibleChildren.length < children.length - 1) {
      setInvisibleChildren([...invisibleChildren, index])
      setSnackbarUndo(index)
    }
  }

  const childrenToRender = children
      .map((ch, index) => React.cloneElement(ch, { maxWidth: widthConstrainedSize, maxHeight: heightConstrainedSize, onClick: () => onClick(index) }))
      .filter((ch, index) => !invisibleChildren.includes(index))

  return (
    <Box ref={fullscreenRef} className='fullscreen' display={enabled ? 'block' : 'none'}>
      <Grid container justifyContent="center" alignItems="center" sx={{ height: '100%', width: '100%' }}>
        <Stack direction='row' alignItems='flex-end' spacing={0}>
          {childrenToRender}
        </Stack>
      </Grid>
      <Snackbar
        open={snackbarUndo != null}
        autoHideDuration={6000}
        message="Traffic light hidden"
        action={action}
      />
    </Box>
  )
}
