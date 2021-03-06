
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config()
const { Pool } = require('pg')
const pool = new Pool({
  user: 'tunkkibois',
  host: 'db',
  database: 'tunkkidb',
  password: 'tunkkitunkki',
  port: 5432,
})

const testConnection = async () => {
  try {
    const client = await pool.connect()
    try {
      //const res = await client.query('SELECT * FROM users WHERE id = $1', [1])
      const res = await client.query('SELECT NOW()')
      console.log(res.rows[0])
    } finally {
      // Make sure to release the client before any error handling,
      // just in case the error handling itself throws an error.
      client.release()
    }
  } catch (err) {
    console.log(err.stack)
  }
}

const getUser = async (username: any, password: any) => {
  try {
    const client = await pool.connect()
    try {
      const res = await client.query('SELECT id FROM users WHERE username=$1 AND pwd=$2', [username, password])
      console.log(res)
      return res.rows[0]
    } finally {
      // Make sure to release the client before any error handling,
      // just in case the error handling itself throws an error.
      client.release()
    }
  } catch (err) {
    console.log(err.stack)
  }
}

const joinPool = async (userid: any, poolid: any, startpoint: any, endpoint: any) => {
  try {
    const client = await pool.connect()
    try {
      const startpoints = await client.query('INSERT INTO points (lat, lon, ptime) VALUES ($2, $1, NULL) RETURNING id',[startpoint[0], startpoint[1]])
      const endpoints = await client.query('INSERT INTO points (lat, lon, ptime) VALUES ($2, $1, NULL) RETURNING id',[endpoint[0], endpoint[1]])
      const res = await client.query('INSERT INTO pool_route (poolid, startpoint, endpoint, userid) VALUES ($1, $2, $3, $4) RETURNING id', [poolid, startpoints.rows[0].id, endpoints.rows[0].id, userid])
      return res.rows[0]
    } finally {
      // Make sure to release the client before any error handling,
      // just in case the error handling itself throws an error.
      client.release()
    }
  } catch (err) {
    console.log(err.stack)
  }
}

const createPool = async (userid: any, startpoint: any, endpoint: any, poolname: any) => {
  try {
    const client = await pool.connect()
    try {
      const startpoints = await client.query('INSERT INTO points (lat, lon, ptime) VALUES ($2, $1, NULL) RETURNING id',[startpoint[0], startpoint[1]])
      const endpoints = await client.query('INSERT INTO points (lat, lon, ptime) VALUES ($2, $1, NULL) RETURNING id',[endpoint[0], endpoint[1]])
      const newPool = await client.query('INSERT INTO pools (poolname, car) VALUES ($1, 1) RETURNING id',[poolname])
      const res = await client.query('INSERT INTO pool_route (poolid, startpoint, endpoint, userid) VALUES ($1, $2, $3, $4) RETURNING id', [newPool.rows[0].id, startpoints.rows[0].id, endpoints.rows[0].id, userid])
      return res.rows[0]
    } finally {
      // Make sure to release the client before any error handling,
      // just in case the error handling itself throws an error.
      client.release()
    }
  } catch (err) {
    console.log(err.stack)
  }
}


const getPoolsForUser = async (userid: any) => {
  try {
    const client = await pool.connect()
    try {

      const res = await client.query(getPoolsByUserQuery, [userid])
      //console.log(res.rows)
      return res.rows
    } finally {
      // Make sure to release the client before any error handling,
      // just in case the error handling itself throws an error.
      client.release()
    }
  } catch (err) {
    console.log(err.stack)
  }
}

const getPoolsWithId = async (poolid: any) => {
  try {
    const client = await pool.connect()
    try {
      const res = await client.query('SELECT * FROM pool_route WHERE id=$1', [poolid])
      //console.log(res.rows)
      return res.rows
    } finally {
      // Make sure to release the client before any error handling,
      // just in case the error handling itself throws an error.
      client.release()
    }
  } catch (err) {
    console.log(err.stack)
  }
}

const getPools = async () => {
  try {
    const client = await pool.connect()
    try {
      const res = await client.query('SELECT * FROM pool_route', [])
      console.log(res.rows)
      return res.rows
    } finally {
      // Make sure to release the client before any error handling,
      // just in case the error handling itself throws an error.
      client.release()
    }
  } catch (err) {
    console.log(err.stack)
  }
}

const getPoolsWithLocations = async () => {
  try {
    const client = await pool.connect()
    try {
      const res = await client.query(getPoolLocationQuery, [])
      //console.log(res.rows)
      return res.rows
    } finally {
      // Make sure to release the client before any error handling,
      // just in case the error handling itself throws an error.
      client.release()
    }
  } catch (err) {
    console.log(err.stack)
  }
}

const getPoolWithAllLocations = async (poolid: any) => {
  try {
    const client = await pool.connect()
    try {
      const res = await client.query(getPoolLocationsQuery, [poolid])
      //console.log(res.rows)
      return res.rows
    } finally {
      // Make sure to release the client before any error handling,
      // just in case the error handling itself throws an error.
      client.release()
    }
  } catch (err) {
    console.log(err.stack)
  }
}


const getPoolsByUserQuery = `SELECT pool_route.poolid, pools.poolname FROM pool_route
LEFT OUTER JOIN pools ON pool_route.poolid=pools.id
WHERE pool_route.userid=$1`

const getPoolLocationsQuery = `SELECT p1.lat AS startlat, p1.lon AS startlon,
p2.lat AS endlat, p2.lon AS endlon
FROM pool_route 
LEFT OUTER JOIN points p1 ON pool_route.startpoint=p1.id
LEFT OUTER JOIN points p2 ON pool_route.endpoint=p2.id
WHERE pool_route.poolid=$1`

const getPoolLocationQuery = `SELECT p1.lat AS startlat, p1.lon AS startlon, pool_route.userid, pool_route.id AS routeid, pool_route.poolid,
p2.lat AS endlat, p2.lon AS endlon,
pools.poolname
FROM pool_route 
LEFT OUTER JOIN points p1 ON pool_route.startpoint=p1.id
LEFT OUTER JOIN points p2 ON pool_route.endpoint=p2.id
LEFT OUTER JOIN pools ON pool_route.poolid=pools.id`


export default { testConnection, getUser, getPoolsForUser, getPools, getPoolsWithLocations, getPoolsWithId, joinPool, createPool, getPoolWithAllLocations}