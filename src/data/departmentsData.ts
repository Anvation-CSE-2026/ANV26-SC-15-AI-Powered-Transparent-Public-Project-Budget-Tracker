import type { Department, Officer } from '../types/complaint';

export const INITIAL_DEPARTMENTS: Department[] = [
  {
    id: 'dept_roads',
    name: 'Roads & Infrastructure',
    code: 'ROADS',
    description: 'Road resurfacing, pothole repairs, bridges, footpaths, and street furniture.',
    slaHoursDefault: 48,
  },
  {
    id: 'dept_drainage',
    name: 'Stormwater & Drainage',
    code: 'DRAIN',
    description: 'Drain clearing, culvert maintenance, stormwater conduits, and flood relief.',
    slaHoursDefault: 36,
  },
  {
    id: 'dept_water',
    name: 'Water Supply & Sewerage',
    code: 'WATER',
    description: 'Potable water pipelines, pressure issues, pipe bursts, and sewerage lines.',
    slaHoursDefault: 24,
  },
  {
    id: 'dept_sanitation',
    name: 'Waste Management & Sanitation',
    code: 'SANI',
    description: 'Garbage accumulation, community bin clearance, public hygiene, and composting.',
    slaHoursDefault: 24,
  },
  {
    id: 'dept_electrical',
    name: 'Electrical & Street Lighting',
    code: 'ELEC',
    description: 'Streetlight outages, dark spots, solar mast lamps, and public cable safety.',
    slaHoursDefault: 36,
  },
  {
    id: 'dept_traffic',
    name: 'Traffic & Urban Mobility',
    code: 'TRAFF',
    description: 'Signal timing, road signs, pedestrian safety dividers, and parking congestion.',
    slaHoursDefault: 48,
  },
  {
    id: 'dept_parks',
    name: 'Parks & Recreation',
    code: 'PARK',
    description: 'Public park maintenance, tree trimming, children playground equipment, and green belts.',
    slaHoursDefault: 72,
  },
  {
    id: 'dept_public_works',
    name: 'General Public Works',
    code: 'PWD',
    description: 'Municipal building repairs, civic center amenities, and inter-departmental works.',
    slaHoursDefault: 72,
  },
];

export const MUNICIPAL_OFFICERS: Officer[] = [
  {
    id: 'off_01',
    name: 'Vikram Joshi (Executive Engineer)',
    designation: 'Executive Engineer - North Sector',
    departmentId: 'dept_roads',
    email: 'v.joshi@city.gov.in',
  },
  {
    id: 'off_02',
    name: 'Pooja Kulkarni (Drainage Inspector)',
    designation: 'Senior Drainage Superintendent',
    departmentId: 'dept_drainage',
    email: 'p.kulkarni@city.gov.in',
  },
  {
    id: 'off_03',
    name: 'Suresh Patil (Water Works Officer)',
    designation: 'Water Operations Supervisor',
    departmentId: 'dept_water',
    email: 's.patil@city.gov.in',
  },
  {
    id: 'off_04',
    name: 'Anita Deshmukh (Sanitation Officer)',
    designation: 'Chief Sanitary Inspector',
    departmentId: 'dept_sanitation',
    email: 'a.deshmukh@city.gov.in',
  },
  {
    id: 'off_05',
    name: 'Ramesh Sawant (Electrical In-Charge)',
    designation: 'Lighting & Maintenance Engineer',
    departmentId: 'dept_electrical',
    email: 'r.sawant@city.gov.in',
  },
  {
    id: 'off_06',
    name: 'Kavita Shinde (Traffic Planner)',
    designation: 'Municipal Mobility Officer',
    departmentId: 'dept_traffic',
    email: 'k.shinde@city.gov.in',
  },
];
