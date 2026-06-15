export const CUBE_VERTICES = [
  [-0.5, -0.5, -0.5],
  [ 0.5, -0.5, -0.5],
  [ 0.5,  0.5, -0.5],
  [-0.5,  0.5, -0.5],
  [-0.5, -0.5,  0.5],
  [ 0.5, -0.5,  0.5],
  [ 0.5,  0.5,  0.5],
  [-0.5,  0.5,  0.5],
];

export const CUBE_EDGES = [
  [0, 1], [1, 2], [2, 3], [3, 0], // back face
  [4, 5], [5, 6], [6, 7], [7, 4], // front face
  [0, 4], [1, 5], [2, 6], [3, 7], // connecting edges
];

// Helper to build 3x3 intrinsic matrix
export function buildIntrinsicMatrix(fx: number, fy: number, cx: number, cy: number, skew: number = 0.0) {
  return [
    [fx, skew, cx],
    [0,  fy,   cy],
    [0,  0,    1.0]
  ];
}

// Build a 3x3 rotation matrix from Euler angles (rx, ry, rz in radians)
// using standard XYZ rotation order.
function eulerToRotationMatrix(rx: number, ry: number, rz: number) {
  const cx = Math.cos(rx), sx = Math.sin(rx);
  const cy = Math.cos(ry), sy = Math.sin(ry);
  const cz = Math.cos(rz), sz = Math.sin(rz);

  // R = Rz * Ry * Rx
  return [
    [ cy*cz, sx*sy*cz - cx*sz, cx*sy*cz + sx*sz ],
    [ cy*sz, sx*sy*sz + cx*cz, cx*sy*sz - sx*cz ],
    [ -sy,   sx*cy,            cx*cy            ]
  ];
}

// Project 3D points to 2D pixels
export function projectPoints(
  points3D: number[][],
  K: number[][],
  rvec: number[], // [rx, ry, rz]
  tvec: number[]  // [tx, ty, tz]
): { x: number, y: number, z: number }[] {
  const R = eulerToRotationMatrix(rvec[0], rvec[1], rvec[2]);
  const [tx, ty, tz] = tvec;

  return points3D.map(pt => {
    const [X, Y, Z] = pt;

    // 1. World to Camera (x_cam = R * X_world + t)
    const xCam = R[0][0]*X + R[0][1]*Y + R[0][2]*Z + tx;
    const yCam = R[1][0]*X + R[1][1]*Y + R[1][2]*Z + ty;
    const zCam = R[2][0]*X + R[2][1]*Y + R[2][2]*Z + tz;

    // 2. Camera to Image Plane (x_img = K * x_cam)
    const xImg = K[0][0]*xCam + K[0][1]*yCam + K[0][2]*zCam;
    const yImg = K[1][0]*xCam + K[1][1]*yCam + K[1][2]*zCam;
    const zImg = K[2][0]*xCam + K[2][1]*yCam + K[2][2]*zCam;

    // 3. Perspective divide
    return {
      x: xImg / zImg,
      y: yImg / zImg,
      z: zCam // return zCam to help with depth clipping
    };
  });
}
