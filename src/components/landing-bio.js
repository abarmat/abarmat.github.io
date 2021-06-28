import React from "react"
import PropTypes from "prop-types"
import { StaticQuery, graphql } from "gatsby"
import styled from "@emotion/styled"

const Container = styled.div`
  position: relative;
  top: -32px;
  text-align: center;
`

const OuterContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: row;
  height: 78vh;
`

const Description = styled.p`
  padding: 0;
  margin-bottom: 1rem;
  font-size: 1.2rem;
`

const NameHeader = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 0;
`

const Avatar = styled.p`
  position: relative;
  img {
      border-radius: 32px;
      opacity: 70%;
      width: 60px;
  }
`

const Follow = styled.p`
  text-transform: uppercase;
  a {
    background-color: #444;
    color: #fff;
    font-size: 13px;
    font-weight: bold;
    padding: 8px 12px;
    text-decoration: none;
  }
`

const LandingBio = () => (
  <StaticQuery
    query={graphql`
      query LandingSiteTitleQuery {
        site {
          siteMetadata {
            title
            subtitle
          }
        }
      }
    `}
    render={data => (
      <OuterContainer>
        <Container>
          <Avatar>
            <img alt="ab" src="ab.jpg" />
          </Avatar>
          <NameHeader>{data.site.siteMetadata.title}</NameHeader>
          <Description>{data.site.siteMetadata.subtitle}</Description>
          <Follow>
            <a href="https://twitter.com/abarmat">Follow Me</a>
          </Follow>
        </Container>
      </OuterContainer>
    )}
  />
)

NameHeader.propTypes = {
  siteTitle: PropTypes.string,
  subtitle: PropTypes.string,
}

NameHeader.defaultProps = {
  siteTitle: ``,
  subtitle: ``,
}

export default LandingBio
