import {Axios, AxiosResponse} from 'axios';
import { promises as fs } from 'fs';
import fsConstants from 'fs';
import {SolarSystem} from '../zKillSubscriber';


const ESI_URL = 'https://esi.evetech.net/latest/';
const GET_SOLAR_SYSTEM_URL = 'universe/systems/%1/';
const GET_CONSTELLATION_URL = 'universe/constellations/%1/';
const GET_REGION_URL = 'universe/regions/%1/';
const GET_TYPE_DATA_URL = '/universe/types/%1/';

export class EsiClient {
    private axios: Axios;

    constructor() {
        this.axios = new Axios({baseURL: ESI_URL, responseType: 'json', transformResponse: data => JSON.parse(data)});
    }

    async fetch(path: string) : Promise<AxiosResponse<any, any>> {
        return await this.axios.get(path);
    }

    async getSystemInfo(systemId: number): Promise<SolarSystem> {
        const systemData = await this.fetch(GET_SOLAR_SYSTEM_URL.replace('%1', systemId.toString()));
        if(systemData.data.error) {
            throw new Error('SYSTEM_FETCH_ERROR');
        }
        const constData = await this.fetch(GET_CONSTELLATION_URL.replace('%1', systemData.data.constellation_id));
        if(systemData.data.error) {
            throw new Error('CONST_FETCH_ERROR');
        }
        const regionData = await this.fetch(GET_REGION_URL.replace('%1', constData.data.region_id));
        if(systemData.data.error) {
            throw new Error('REGION_FETCH_ERROR');
        }

        return {
            id: systemId,
            regionId: regionData.data.region_id,
            regionName: regionData.data.name,
            constellationId: constData.data.constellation_id,
            constellationName: constData.data.name
        };
    }

    async getTypeGroupId(shipId: number): Promise<number> {
        const itemData = await this.fetch(GET_TYPE_DATA_URL.replace('%1', shipId.toString()));
        if(itemData.data.error) {
            throw new Error('ITEM_FETCH_ERROR');
        }
        return Number.parseInt(itemData.data.group_id);
    }

    async getShipFromId(shipId: number): Promise<any> {
        const shipIdString = shipId.toString();
        const fileName = 'shipIds.json';

        try {
            // Check if the file exists
            let fileExists;

            try {
                await fs.access('./' + fileName, fsConstants.constants.F_OK);
                fileExists = true;
            } catch (error) {
                fileExists = false;
            }

            if (fileExists) {
                // Read the file
                const data = await fs.readFile('./' + fileName, 'utf8');

                const shipIds = JSON.parse(data);

                // Check if the shipId exists in the file
                if (shipIds[shipIdString]) {
                    return shipIds[shipIdString];
                }
            }

            // Fetch the item data if not found in the file or file does not exist
            const itemData = await this.fetch(GET_TYPE_DATA_URL.replace('%1', shipIdString));

            if (itemData.data.error) {
                throw new Error('ITEM_FETCH_ERROR');
            }

            // Update or create the file with new data
            const newShipIdData = fileExists ? JSON.parse(await fs.readFile('./' + fileName, 'utf8')) : {};
            newShipIdData[shipIdString] = itemData.data.name;
            await fs.writeFile('./'+ fileName, JSON.stringify(newShipIdData, null, 2), 'utf8');

            return itemData.data.name;
        } catch (error: any) {
            throw new Error('An error occurred: ' + error.message);
        }
    }
}