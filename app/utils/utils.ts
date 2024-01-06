import axios from 'axios'

export const axiosInstance = axios.create({
  baseURL: 'https://api.tiny.com.br/api2'
})
