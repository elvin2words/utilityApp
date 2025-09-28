// types/facilities.ts

import React from "react";

export type Transformer = {
  Name: string;
//   capacity: number | null;
  capacity: string | null;
  maxcapacity: number | null;
  cooling: string | null;
  status: string | null;
  application: string | null;
  mounting: string | null;
  voltageratio: string | null;
  transformerinsulation: string | null;
  vectorgroup: string | null;
  sourcefeeder: string | null;
  primary_sub: string | null;
  lat: number | null;
  lon: number | null;
  is_subtransformer: number;
  highvoltage: number | null;
  lowvoltage: number | null;
  assetCateg: string | null;
};

export type OverheadLine = {
  depot: number | null;
  district: number | null;
  region: number | null;
  feedercode: string | null;
  length: number | null;
  voltagelev: number | null;
  conductors: number | null;
  conductort: string | null;
  phases: number | null;
  assetCateg: string | null;
};

export type Meter = {
  depot: number | null;
  district: number | null;
  region: number | null;
//   meterno: number;
  meterno: string;
  tariff: string | null;
  make: string | null;
  mcbsize: number | null;
  meteringtype: string | null;
  contractedcapacity: number | null;
  phase: string | null;
  customername: string | null;
  phone: number | null;
  billaddress: string | null;
  email: string | null;
  servicevoltage: number | null;
  suburbid: string | null;
  accountno: number | null;
  lat: number | null;
  lon: number | null;
  sourcefeeder_mv: string | null;
  sourcefeeder_11: string | null;
  sourcefeeder_33: string | null;
  sourcefeeder_132: string | null;
  sourcesub_11: string | null;
  sourcesub_33: string | null;
  sourcesub_132: string | null;
  service_point: number | null;
  assetCateg: string | null;
};

export type Facility = {
  transformers: Transformer[];
  overheads: OverheadLine[];
  meters: Meter[];
};
