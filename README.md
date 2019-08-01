# Acuris API Guidlines

At Acuris our business domain mostly centers around the creation, curation and distribution of entities. Our software architecture is made up of decoupled microservices that provide data to front end service via REST-ish APIs that normally expose JSON payloads.

The aim of this document is to provide best practice guidelines for structuring those APIs.

# Play along at home

This repo includes a reference implementation of an API which was written to conform to these guidelines. The links in this document will work on your machine if you have the application running (requires node > v10)

```
$ npm i
$ npm start
```

Will open a server on port `10010`.

The sample dataset is a selection of reviews on wines. You can get reviews by id, or search and filter reviews by some of their attributes.

To get started visit http://localhost:10010/docs/#/

# Principles

- Our APIs should most purely express what our systems do. e.g. _Acuris creates Intels, the ISS allows clients to view, search and filter Intels_
- Our APIs should be intuitive, consistent and as simple as possible
- Our APIs should have high [affordance](https://en.wikipedia.org/wiki/Affordance), meaning that engineers should easily be able to understand _what_ the API does and _how_ to use it

# General Guidelines

- Use nouns not verbs when describing operations on entities. Allow HTTP verbs to define the operations. e.g. `GET /companies` and `PUT /companies` not `GET /getCompanies`
- Use plural names to describe resources. For example `/companies` not `/company`. It avoids confusion about whether we’re talking about a single resource or a collection and more directly maps to how it might be written in code. e.g.
```
GET  /companies          -> companies
POST /companies          -> companies.push(data)
GET  /companies/1        -> companies[1]
PUT  /companies/1        -> orders[1] = { name:'foo', mmgid:'prime-123' }
GET  /companies/1/name   -> orders[1].name
```
- It can be useful if these ‘root’ resource uris return a list of child resources e.g. http://localhost:10010/v1/reviews - but may not be required for your use case

```
$ curl -i http://localhost:10010/v1/reviews?fields=id&size=2
HTTP/1.1 200 OK

{
  "results": [
    {
      "id": "269"
    },
    {
      "id": "184"
    }
  ],
  "after": "http://localhost:10010/reviews?after=184&fields=id&size=2",
  "total": 425
}
```

- Get by ID should have the ID at the end of the uri e.g. http://localhost:10010/v1/reviews/269
- You may also want to implement similar functionality as filter to get multiple ids e.g. http://localhost:10010/v1/reviews?ids=269,123
- Prefer to return results as arrays, even if there is only one item. This means that you only need to implement one code path to deal with responses of the same entity type

```
$ curl http://localhost:10010/v1/reviews/269

[
  {
    "country": "Argentina",
    "province": "Mendoza Province",
    "variety": "Cabernet Sauvignon",
    "kind": "review",
    "price": "15.0",
    "geography": "Argentina#Mendoza Province#Agrelo#",
    "description": "Immediately this smells raisiny, but with time secondary scents of cinnamon and Middle Eastern spices come into play. The body is soft and extracted, with modest acidity. Flavors of baked black fruits, fig paste, chocolate and herbs follow the nose, as does a chocolaty, rich  finish. Drink through 2016.",
    "id": "269",
    "designation": "Single Vineyard Reserva",
    "winery": "Lamadrid",
    "region": "Agrelo",
    "points": "88"
  }
]
```

- Use the `Accept` in request headers and `Content-Type` in the response headers to indicate the media type of the response. _Most of our APIs respond with JSON so setting the `Content-Type` to `application/json` would be a sensible default in the case that no `Accept` header is passed_
- If invalid parameters are supplied, respond with a HTTP response code of 400. This indicates to the client that it should not try again without altering the request. Also include a list of valid parameters to help the client make the correct choice. e.g.

```
 $ curl -i http://example-api.com/resources?unknownParam=true

 HTTP/1.1 400 Bad Request

{
   "message":"There were unknown parameters in the request \"unknownParam\"",
   "validParams":[
      "after",
      "before",
      "size",
      "countries",
      "q",
      "fields",
      "sort"
   ]
}
```

- Use [Consumer Driven Contracts](https://martinfowler.com/articles/consumerDrivenContracts.html) to increase confidence when making API changes. Libraries used within the company for this are [Pact](https://docs.pact.io/) and [Mockingjay](https://github.com/quii/mockingjay-server)
- Ensure all input values are sanitized, this will allow easier comparisons. e.g. `"Value1 !== value1"`

# Query, Sorting and Pagination

- Query parameters with the same name but multiple values should be logically OR and be comma-separated under the same key in order to keep the URL compact.
  e.g. _show only reviews from German or Spanish wines_ [`http://localhost:10010/v1/reviews?countries=germany,spain`](http://localhost:10010/v1/reviews?countries=germany,spain)
- Free text search should be accomplished by passing a `q` parameter containing the url encoded string to be searched.
  e.g. _show only reviews that mention "acidity"_ [`http://localhost:10010/v1/reviews?q=acidity`](http://localhost:10010/v1/reviews?q=acidity)
- Prefer the use of cursoring over pagination, unless there is a valid reason to do so
- If using pagination instead of cursoring use `size` and `offset` parameters to define the bounds of the pages. If a `size` is not passed, fallback to a sensible default
- If sorting, use `+` and `-` characters to determine field sort order. e.g. _show all reviews by their review score descending_ [`http://localhost:10010/v1/reviews?sort=+points`](http://localhost:10010/v1/reviews?sort=%2Bpoints)
- For more complex querying and sorting, for example using `<`, `>`, `!=`, or other logical operators, consider passing the query in the body of the request as illustrated in the [Elasticsearch API](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-request-body.html)
- Consider including a correlation ID in the error response to allow the request to be traced through your system which can either be passed in as a request header or generated on the server by your client. [See example here](https://github.com/mergermarket/lead-admin/blob/359463927cca7b47837b8686ae716713597cdebf/src/server/middleware/correlation-id.ts)

# Errors

- If a request responds with an error, present a meaningful error in the response by defining an error object in the JSON containing either an error message, or a _specific error code_ if the API is public and exposing the internals is undesirable

```
$ curl -i http://example-api.com/error
HTTP/1.1 504 Internal Server Error

{
    "error": {
        "code":"ISS-12",
        "message": "An error was received from the database, please try again later"
    }
}
```

- Use the appropriate HTTP error status codes to inform clients when their request has not been successful
  - For a general server error, use the `500` status code
  - If a downstream service is not available. Use the `504` status to inform the client that the service is temporarily unavailable and the request should be retried
- If rate limiting is required use the `429` error code along with a `Retry-After` header

# Common Query Parameters

Where possible, stick to common conventions for query parameter names as follows:

| Parameter Name       | Description                                                                                                                                                                                               |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mmgid`              | the ID of a resource in the Prime database. Ensure that it is structured as `<source>-<id-within-source>` e.g `prime-1234` or `docrepo-10201`                                                             |
| `fields`             | if allowing the client to specify a subset of fields to be returned                                                                                                                                       |
| `sort`               | to allow the ordering of returned results. For specific ordering use `+` for ascending and `-` for descending                                                                                             |
| `before` and `after` | if using cursoring, provide the previous and next cursor values. Where `after` is a pointer to the last resource in the current page and `before` is a pointer to the first resource in the current page. |
| `offset`             | if using pagination, provide the offset of the first item and use in conjunction with `size` to provide the number of items per page                                                                      |
| `size`               | the number of items returned in the response                                                                                                                                                              |

# Performance and Cacheability

- Gzip responses where possible - unless the compression causes performance bottlenecks on the server
- Prefer caching on the server over caching on the client. In general our APIs dont receive enough traffic to worry too much about client-side caching. However, as a rule GET requests should always be cacheable. If caching is required at the client level then use an ETAG to inform the client when a resource has changed

# Versioning

- Provide a version number at the beginning of the path e.g. `/v1/companies/prime-123`
- Don't provide an endpoint that does not contain a version
- Don't provide a `latest` version. This removes ambiguity around what the API will respond with
- Versions should be enumerated using whole numbers (`v1`, `v2`) not (`v1`, `v1.1`)
- Only increment the version when there are breaking changes

# Common consitencies

- Any custom headers should follow the Hyphenated-Pascal-Case convention of standard HTTP headers. e.g. `X-Correlation-Id`
- A trailing slash should not provide any implicit or explicit functionality. e.g. `/companies` and `/companies/` should return the same response
- JSON responses should be consistent in their casing
