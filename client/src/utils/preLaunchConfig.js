
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const PRE_LAUNCH_CONFIG = {
  // Master toggle for pre-launch mode (Set to false so users go directly to dashboard upon login)
  enabled: false,

  /**
   * Determines whether pre-launch restrictions are currently active.
   * When false, users navigate directly to /dashboard upon login.
   */
  isPreLaunchActive: (_user = null) => {
    if (typeof window === "undefined") return false;
    return Boolean(PRE_LAUNCH_CONFIG.enabled);
  },

  /**
   * Toggles pre-launch mode on/off
   */
  setPreLaunchActive: (active) => {
    PRE_LAUNCH_CONFIG.enabled = Boolean(active);
  },
};

export default PRE_LAUNCH_CONFIG;
