import express from 'express'
const router = express.Router()
import kiesi_service from '../services/kiesi_service'
const jwt = require('jsonwebtoken')
require('dotenv').config()
import distance from '@turf/distance'
import {point} from '@turf/helpers'

var jwtmiddleware = require('express-jwt')

router.get('/', async (_request, response) => {
  await kiesi_service.testConnection()
  response.status(200).send("nauraaaaa")
})

router.post('/login', async (req, res) => {
  const reqq = JSON.parse(req.body)
  let username = reqq.username
  let password = reqq.password

  const id = await kiesi_service.getUser(username, password)

  if (!id) {
    return res.status(401).send()
  }
  //use the payload to store information about the user such as username, user role, etc.
  let payload = { user: id }

  console.log(process.env.ACCESS_TOKEN_LIFE)
  //create the access token with the shorter lifespan
  let accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: parseInt(<any>process.env.ACCESS_TOKEN_LIFE)
  })

  //send the access token to the client inside a cookie
  //res.cookie("jwt", accessToken, { secure: true, httpOnly: true })
  res.status(200).send({"bearer":accessToken})
  return ""
})

router.get('/protected',
  jwtmiddleware({ secret: process.env.ACCESS_TOKEN_SECRET, algorithms: ['HS256'] }),
  (req, res) => {
    console.log((<any>req).user)
    if (!(<any>req).user) return res.sendStatus(401);
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send((<any>req).user.user)
  });

router.get('/pools',
  jwtmiddleware({ secret: process.env.ACCESS_TOKEN_SECRET, algorithms: ['HS256'] }),
  async (req, res) => {
    console.log((<any>req).user)
    if (!(<any>req).user) return res.sendStatus(401);
    res.setHeader('Content-Type', 'application/json');

    console.log((<any>req).user.user.id)
    const pools = await kiesi_service.getPoolsForUser((<any>req).user.user.id)

    return res.status(200).send(pools)
  });


//post joinpool(userid (jwt), poolid) -> userid added to pool
router.post('/joinpool',
  jwtmiddleware({ secret: process.env.ACCESS_TOKEN_SECRET, algorithms: ['HS256'] }),
  async (req, res) => {
    if (!(<any>req).user) return res.sendStatus(401);

    const reqq = JSON.parse(req.body)
    const poolid = reqq.poolid
    const startpoint = reqq.startpoint
    const endpoint = reqq.endpoint
    const id = (<any>req).user.user.id
    const ret = await kiesi_service.joinPool(id, poolid, startpoint, endpoint)
    //console.log(ret)
    return res.status(200).send(ret)
  });

router.post('/search',
  jwtmiddleware({ secret: process.env.ACCESS_TOKEN_SECRET, algorithms: ['HS256'] }),
  async (req, res) => {
    if (!(<any>req).user) return res.sendStatus(401);
    const pools = await kiesi_service.getPoolsWithLocations()
    
    const reqq = JSON.parse(req.body)
    const startpoint = point(reqq.startpoint)
    const endpoint = point(reqq.endpoint)
    //console.log("distance between params " + distance(startpoint, endpoint))
    
    const makePoints = pools.map((i: { userid: any; id: any; startlat: any; startlon: any; endlat: any; endlon: any; poolname: any }) => {
      return {
        "userid": i.userid,
        "poolid": i.id,
        "startpoint": point([i.startlon, i.startlat]),
        "endpoint": point([i.endlon, i.endlat]),
        "name": i.poolname
      }
    })
    //console.log(makePoints)
    const filtered = makePoints.filter((i: { startpoint: any; endpoint: any }) => {
      return distance(i.startpoint, startpoint) <= 20 && distance(i.endpoint, endpoint) <= 20
    })
    console.log(filtered);
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(filtered)
});



/**
 * 
 * post /login
 * get /pools (userid) -> list<poolid>
 * get /pool (poolid)  -> poolinfo
 * post /joinpool (start, end, optional: time to reach) -> status(201).send(poolid)
 * post /createpool (start, end, times, maybe: preferred card)
 * 
 * 
 */

export default router
