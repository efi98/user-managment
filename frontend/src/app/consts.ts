import { Gender } from "./interfaces";
import { environment } from "@environments";

export const BASE_URL = environment.apiBaseUrl;
export const GENDERS_LIST = [Gender.Male, Gender.Female, Gender.Other];