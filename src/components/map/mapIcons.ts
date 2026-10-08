import L from 'leaflet';

/**
 * Creates an SVG DivIcon for public capital projects (Royal Blue).
 */
export function createProjectMarkerIcon(status?: string): L.DivIcon {
  const isDelayed = status?.toLowerCase() === 'delayed';
  const isAtRisk = status?.toLowerCase() === 'at risk' || status?.toLowerCase() === 'at_risk';
  const isCompleted = status?.toLowerCase() === 'completed';

  const fillColor = isCompleted
    ? '#059669' // emerald
    : isAtRisk
    ? '#dc2626' // red
    : isDelayed
    ? '#d97706' // amber
    : '#2563eb'; // blue

  const html = `
    <div style="position: relative; width: 34px; height: 42px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.25)); transition: transform 0.15s ease;" class="hover:scale-110">
      <svg width="34" height="42" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 0C7.61 0 0 7.61 0 17C0 27.5 14.5 39.8 15.7 40.8C16.1 41.1 16.5 41.3 17 41.3C17.5 41.3 17.9 41.1 18.3 40.8C19.5 39.8 34 27.5 34 17C34 7.61 26.39 0 17 0Z" fill="${fillColor}"/>
        <circle cx="17" cy="16" r="11" fill="white" />
        <!-- Building/Project Icon -->
        <path d="M13 21V11H21V21H18V16H16V21H13ZM15 13H16V14H15V13ZM18 13H19V14H18V13Z" fill="${fillColor}" />
      </svg>
    </div>
  `;

  return L.divIcon({
    className: 'civic-project-marker',
    html,
    iconSize: [34, 42],
    iconAnchor: [17, 42],
    popupAnchor: [0, -38],
  });
}

/**
 * Creates an SVG DivIcon for civic complaints & issues.
 * Color coding:
 * - Emergency = Red (#ef4444)
 * - High Priority = Orange (#f97316)
 * - Resolved/Closed = Green (#10b981)
 * - Normal/Medium/Low = Cyan (#06b6d4)
 */
export function createComplaintMarkerIcon(priority: string, status: string): L.DivIcon {
  const isResolved = status?.toLowerCase() === 'resolved' || status?.toLowerCase() === 'closed';
  const p = priority?.toLowerCase();

  let fillColor = '#06b6d4'; // default cyan
  let iconPath = '<path d="M17 11V16M17 19H17.01" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>';

  if (isResolved) {
    fillColor = '#10b981'; // green
    iconPath = '<path d="M13 16L16 19L22 13" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>';
  } else if (p === 'emergency') {
    fillColor = '#ef4444'; // red
    iconPath = '<path d="M17 10V16M17 19.5H17.01" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>';
  } else if (p === 'high') {
    fillColor = '#f97316'; // orange
    iconPath = '<path d="M17 10.5V16M17 19H17.01" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>';
  }

  const pulseRing = p === 'emergency' && !isResolved
    ? `<span style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; border-radius: 50%; background: rgba(239, 68, 68, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>`
    : '';

  const html = `
    <div style="position: relative; width: 32px; height: 38px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 3px 5px rgba(0,0,0,0.25)); transition: transform 0.15s ease;" class="hover:scale-110">
      ${pulseRing}
      <svg width="32" height="38" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 0C7.61 0 0 7.61 0 17C0 27.5 14.5 39.8 15.7 40.8C16.1 41.1 16.5 41.3 17 41.3C17.5 41.3 17.9 41.1 18.3 40.8C19.5 39.8 34 27.5 34 17C34 7.61 26.39 0 17 0Z" fill="${fillColor}"/>
        <circle cx="17" cy="16" r="10.5" fill="white" />
        <g color="${fillColor}">
          ${iconPath}
        </g>
      </svg>
    </div>
  `;

  return L.divIcon({
    className: 'civic-complaint-marker',
    html,
    iconSize: [32, 38],
    iconAnchor: [16, 38],
    popupAnchor: [0, -34],
  });
}

/**
 * Creates a pulsing location beacon icon for the user's current GPS location.
 */
export function createUserLocationIcon(): L.DivIcon {
  const html = `
    <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 28px; height: 28px; border-radius: 9999px; background-color: rgba(59, 130, 246, 0.35); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="width: 16px; height: 16px; border-radius: 9999px; background-color: #2563eb; border: 3px solid #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.25);"></div>
    </div>
  `;

  return L.divIcon({
    className: 'civic-user-marker',
    html,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

/**
 * Creates a pin icon for the interactive LocationPicker modal.
 */
export function createPickerMarkerIcon(): L.DivIcon {
  const html = `
    <div style="position: relative; width: 36px; height: 44px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.35));">
      <svg width="36" height="44" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 0C7.61 0 0 7.61 0 17C0 27.5 14.5 39.8 15.7 40.8C16.1 41.1 16.5 41.3 17 41.3C17.5 41.3 17.9 41.1 18.3 40.8C19.5 39.8 34 27.5 34 17C34 7.61 26.39 0 17 0Z" fill="#f59e0b"/>
        <circle cx="17" cy="16" r="11" fill="white" />
        <circle cx="17" cy="16" r="5" fill="#f59e0b" />
      </svg>
    </div>
  `;

  return L.divIcon({
    className: 'civic-picker-marker',
    html,
    iconSize: [36, 44],
    iconAnchor: [18, 44],
    popupAnchor: [0, -40],
  });
}
