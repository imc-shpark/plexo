/**
 * This file is part of PLEXO
 *
 * Author: Diego Cantor
 *
 * PLEXO is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as published by
 * the Free Software Foundation
 *
 * PLEXO is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with PLEXO.  If not, see <http://www.gnu.org/licenses/>.
 */

var VIEW, BRUSH, ERASER;

BRUSH  = plx.setGlobalBrush(new plx.Brush(5, 0.5, 'round'));
ERASER = plx.setGlobalEraser(new plx.Eraser(10));

var gui = {} || gui; //gui namespace
gui.reader = {} || gui.reader; //gui.reader namespace
