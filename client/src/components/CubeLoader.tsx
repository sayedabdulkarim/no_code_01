import React from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';

const rotate = keyframes`
  0% {
    transform: rotateX(0deg) rotateY(0deg);
  }
  100% {
    transform: rotateX(360deg) rotateY(360deg);
  }
`;

const LoaderContainer = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 12px;
`;

const CubeWrapper = styled.div`
  width: 24px;
  height: 24px;
  perspective: 200px;
`;

const Cube = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  animation: ${rotate} 2s linear infinite;
`;

const CubeFace = styled.div`
  position: absolute;
  width: 24px;
  height: 24px;
  border: 2px solid #3b82f6;
  background: rgba(59, 130, 246, 0.1);
  
  &:nth-child(1) {
    transform: translateZ(12px);
  }
  &:nth-child(2) {
    transform: rotateY(90deg) translateZ(12px);
  }
  &:nth-child(3) {
    transform: rotateY(180deg) translateZ(12px);
  }
  &:nth-child(4) {
    transform: rotateY(-90deg) translateZ(12px);
  }
  &:nth-child(5) {
    transform: rotateX(90deg) translateZ(12px);
  }
  &:nth-child(6) {
    transform: rotateX(-90deg) translateZ(12px);
  }
`;

const LoaderText = styled.span`
  color: #9ca3af;
  font-size: 14px;
`;

interface CubeLoaderProps {
  text?: string;
}

const CubeLoader: React.FC<CubeLoaderProps> = ({ text = "Loading..." }) => {
  return (
    <LoaderContainer>
      <CubeWrapper>
        <Cube>
          <CubeFace />
          <CubeFace />
          <CubeFace />
          <CubeFace />
          <CubeFace />
          <CubeFace />
        </Cube>
      </CubeWrapper>
      {text && <LoaderText>{text}</LoaderText>}
    </LoaderContainer>
  );
};

export default CubeLoader;