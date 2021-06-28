import React from "react"
import styled from "@emotion/styled"

import Layout from "../components/layout"
import SEO from "../components/seo"

const Content = styled.div`
  margin: 0 auto;
  max-width: 860px;
  padding: 1.45rem 1.0875rem;

  h3 span {
    color: #444;
    font-size: 22px;
  }
`

const IndexPage = () => {
    return (
      <Layout>
        <SEO title="About" />
        <Content>
          <h1>About</h1>

          <h3><span>#</span> Current</h3>
          <p>I do smart contracts and protocol design at <a href="https://edgeandnode.com" target="_blank" rel="noreferrer">Edge & Node</a>. I was part of the initial team behind <a href="https://thegraph.com" target="_blank" rel="noreferrer">The Graph</a>, where I led the efforts that brought to life The Graph protocol <a href="https://github.com/graphprotocol/contracts" target="_blank" rel="noreferrer">contracts</a>.</p>

          <h3><span>#</span> Recent</h3>
          <p>I joined <a href="https://decentraland.org" target="_blank" rel="noreferrer">Decentraland</a> in 2017 to build the first-ever Metaverse owned by its user. As the Head of the dApps & Smart Contracts team, we pioneered NFTs by launching <a href="https://decentraland.org/blog/platform/designing-genesis-city-roads-urban-planning/" target="_blank" rel="noreferrer">LAND</a>, the most popular ERC721 in Ethereum and a <a href="https://medium.com/decentraland/introducing-the-decentraland-marketplace-d8b4c7d509f8" target="_blank" rel="noreferrer">Marketplace</a> to trade it.</p>

          <h3><span>#</span> Past</h3>
          <p>In 2016 <a href="https://medium.com/@abarmat/two-years-into-the-crypto-rabbit-hole-dff04e874ee9" target="_blank" rel="noreferrer">I jumped fully into crypto</a> as CTO of PopChest, starting a journey that took me to San Mateo, California, and participating in <a href="https://medium.com/boost-vc/say-hello-to-tribe-8-a28bab4fe0bd" target="_blank" rel="noreferrer">Tribe 8</a> of <a href="https://www.boost.vc" target="_blank" rel="noreferrer">Boost VC</a> incubator.</p>
          <p>In 2010 I founded Oony, an online and mobile platform that helped people shop smarter. At its peak, we had +3 million publications in 15 countries, and it was very profitable... until it wasn't, then <a href="https://medium.com/@abarmat/starting-from-scratch-2007-vs-2016-ea7329ff3e6c" target="_blank" rel="noreferrer">I had to start from scratch</a>, and it was good. Before that, I founded Weegoh, the first location-based social network for mobile devices in Latin America that we pivoted to Oony.</p>
        </Content>
      </Layout>
    )
  }

export default IndexPage
