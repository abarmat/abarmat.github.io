import React from "react"
import PropTypes from "prop-types"
import { StaticQuery, graphql } from "gatsby"
import styled from "@emotion/styled"
import AvatarImg from "../images/ab.jpg"

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
  margin-bottom: 2rem;
  font-size: 1.2rem;
`

const NameHeader = styled.h1`
  font-size: 3rem;
  margin-bottom: 0;
`

const Avatar = styled.p`
  position: relative;
  img {
    border-radius: 32px;
    opacity: 85%;
    width: 120px;
  }
`

const Next = styled.a`
  color: hsla(100, 100%, 100%, 0.2);
  font-size: 64px;
  font-weight: bold;
  text-decoration: none;
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
    render={(data) => (
      <OuterContainer>
        <Container>
          <Avatar>
            <img src={AvatarImg} alt="ab" />
          </Avatar>
          <NameHeader>{data.site.siteMetadata.title}</NameHeader>
          <Description>{data.site.siteMetadata.subtitle}</Description>
          <Next href="/about">&#x292B;</Next>
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
