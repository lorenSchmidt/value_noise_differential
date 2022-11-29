// this returns value and slope!
// this is going to look a lot like value noise, so it bears explanation.
// the rest of these have socketable blend functions. this has a built in blending function instead. by getting the derivative of this we can directly get slope at an arbitrary location without sampling multiple points on the curve. this generalizes to n dimensions.
function value_plus_slope_xy( x, y, xsize = 256, ysize = 256, 
                       density = 1, octaves = 8, ratio = 1/2 ) {
    let seed = noise_seed
    let octave_seed = seed
    let scaling_factor = 0 
    let res = density * 2 // octave 0 is not a single value, it's 4, which is the smallest which is relevant for value noise. starting with 1 would give us a flat plane with a random height for octave 0, which would just randomly offset our height without adding information.

    let output = { value: 0, sx: 0, sy: 0 }; amplitude = 1
    let sum = 0; slope_x_sum = 0; slope_y_sum = 0
    
    let p = { x: 0, y: 0 }; amplitude = 1
    for (let o = 0; o < octaves; o ++) {
        // note: the value noise uses a simple inline thing- LCG adjacent?
        octave_seed = (octave_seed + 239487234) % 293842387423
        seed = octave_seed
        
        let csx = xsize / res; csy = ysize / res // size of cell this octave
        let cx = (x / csx + res) % res; cy = (y / csy + res) % res 

        // blend weights for our smoothstep
        let tx = cx % 1; ty = cy % 1
        cx = Math.floor(cx); cy = Math.floor(cy)
        let cx1 = (cx + 1) % res; cy1 = (cy + 1) % res // already integer

        // corner values
        // we do an I for the value and x slope
        let ul = pos3(cx,   cy, seed)                            //   ul──┬──ur
        let ur = pos3(cx1,  cy, seed)                            //       │  
        let bl = pos3(cx,  cy1, seed)                            //       │   
        let br = pos3(cx1, cy1, seed)                            //   bl──┴──br

        // this uses the blending function 6t^5 - 15t^4 + 10t^3
        let x_blend = 6 * tx ** 5 - 15 * tx ** 4 + 10 * tx ** 3
        let y_blend = 6 * ty ** 5 - 15 * ty ** 4 + 10 * ty ** 3
        let x_derivative_blend = 30 * tx ** 4 - 60 * tx ** 3 + 30 * tx ** 2
        let y_derivative_blend = 30 * ty ** 4 - 60 * ty ** 3 + 30 * ty ** 2

        let v0 = ul + (ur - ul) * x_blend                          //  ─┬─  0
        let v1 = bl + (br - bl) * x_blend                          //  ─┴─  1

        let value = v0 + (v1 - v0) * y_blend - 0.5
        let sy    = (v1 - v0) * y_derivative_blend 
        // is this right? feels weird to linear blend- 
        
        // we do an H for the y slope                           //   │     │  0
        let sy0 = ul + (bl - ul) * y_blend                      //   ├─────┤  
        let sy1 = ur + (br - ur) * y_blend                      //   │     │  1
        let sx  = (sy1 - sy0) * x_derivative_blend
        
        sum += amplitude * value
        slope_x_sum += sx; slope_y_sum += sy
        scaling_factor += amplitude

        res *= 2
        amplitude *= ratio
        // we increment after x and y slope earlier. this is for value.
        seed += pc_increment 
    }
    
    output.value = 2 * sum / scaling_factor
    output.sx = slope_x_sum; output.sy = slope_y_sum
    return output
}