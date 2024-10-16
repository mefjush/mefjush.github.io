import { State, STATE_ATTRIBUTES, StateAttributes } from "./state"
import CrossingSettings from "./crossing-settings"
import { negativeSafeMod } from "../utils"


export class Phase {
  state: State
  duration: number

  constructor(state: State, duration: number) {
    this.state = state
    this.duration = duration
  }
  
  stateAttributes(): StateAttributes {
    return STATE_ATTRIBUTES[this.state]
  }
}

export interface LightSettings {
  offset: number
  phases: Phase[]
}

const sortByOrder = (a: Phase, b: Phase) => a.stateAttributes().order - b.stateAttributes().order
const sortByPriority = (a: Phase, b: Phase) => a.stateAttributes().priority - b.stateAttributes().priority

export default class LightConfig {

  crossingSettings: CrossingSettings
  offset: number
  phases: Phase[]

  constructor(crossingSettings: CrossingSettings, lightSettings: LightSettings) {
    this.crossingSettings = crossingSettings
    this.offset = lightSettings.offset
    this.phases = this.rescale(crossingSettings, lightSettings).phases
  }

  withOffset(offset: number): LightSettings {
    // let positiveOffset = negativeSafeMod(offset, this.cycleLength() + 1000)
    let roundedOffset = Math.round((offset / 1000)) * 1000
    return { offset: roundedOffset, phases: this.phases }
  }

  toLightSettings(): LightSettings {
    return { offset: this.offset, phases: this.phases }
  }

  cycleLength() {
    return this.crossingSettings.cycleLength
  }

  isFixable(phase: Phase): boolean {
    return phase.stateAttributes().priority >= 3
  }

  roundSeconds(duration: number): number {
    return Math.round(duration / 1000) * 1000
  }

  rescale(crossingSettings: CrossingSettings, lightSettings: LightSettings): LightSettings {
    let phasesLength = lightSettings.phases.reduce((acc, phase) => acc + phase.duration, 0)
    let diff = crossingSettings.cycleLength - phasesLength

    if (Math.abs(diff) == 0) {
      return lightSettings
    }

    let fixableCount = lightSettings.phases.filter(this.isFixable).length
    let diffPerPhase = this.roundSeconds(diff / fixableCount)
    let diffRemainder = diff

    let fixedPhases = lightSettings.phases.toSorted((a, b) => b.duration - a.duration)
    
    let fixStrategies = [
      { precondition: this.isFixable, applicableDiff: () => diffPerPhase },
      { precondition: this.isFixable, applicableDiff: () => diffRemainder },
      { precondition: (p: Phase) => true, applicableDiff: () => diffRemainder }
    ]

    for (let i = 0; i < fixStrategies.length && Math.abs(diffRemainder) != 0; i++) {
      let strategy = fixStrategies[i]
      fixedPhases = fixedPhases.map((phase) => {
        if (!strategy.precondition(phase)) {
          return phase
        }
        let applicableDiff = Math.max(strategy.applicableDiff(), -phase.duration)
        diffRemainder -= applicableDiff
        return new Phase(phase.state, phase.duration + applicableDiff)
      })
    } 
    
    return { ...lightSettings, phases: fixedPhases.toSorted(sortByOrder) }
  }
    
  withStateDuration(state: State, newDuration: number): LightSettings {
    let remainingPhases = this.phases.filter(p => p.state != state).toSorted(sortByPriority).reverse()
    let fixablePhases = remainingPhases.filter(this.isFixable)
    let unfixablePhases = remainingPhases.filter(p => !this.isFixable(p))

    let oldDuration = this.phases.find(p => p.state == state)?.duration || 0
    let diff = oldDuration - newDuration;

    let fixedRemaining = []
    
    for (let p of fixablePhases) {
      let durationBeforeFix = p.duration
      fixedRemaining.push(new Phase(p.state, Math.max(0, p.duration + diff)))
      if (diff < 0 && durationBeforeFix < Math.abs(diff)) {
        diff = diff + durationBeforeFix
      } else {
        diff = 0
      }
    }

    fixedRemaining.push(new Phase(state, newDuration + diff))

    return { offset: this.offset, phases: fixedRemaining.concat(unfixablePhases).toSorted(sortByOrder) }
  }
}

export const DEFAULT_LIGHT_SETTINGS = {
  offset: 0,
  phases: [
    new Phase(State.RED, 30_000),
    new Phase(State.RED_YELLOW, 2_000),
    new Phase(State.GREEN, 26_000),
    new Phase(State.YELLOW, 2_000)
  ]
}
