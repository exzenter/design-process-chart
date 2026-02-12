/**
 * Shared timeline SVG renderer.
 * Works in both the editor (via React ref) and the frontend (vanilla JS).
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

function getBubbleSize( sizeLevel ) {
	const minSize = 1.0;
	const maxSize = 8.0;
	return minSize + ( ( sizeLevel - 1 ) / 99 ) * ( maxSize - minSize );
}

function createLine( x1, y1, x2, y2, strokeWidth, dashArray ) {
	const line = document.createElementNS( SVG_NS, 'line' );
	line.setAttribute( 'x1', x1 );
	line.setAttribute( 'y1', y1 );
	line.setAttribute( 'x2', x2 );
	line.setAttribute( 'y2', y2 );
	line.setAttribute( 'stroke-width', strokeWidth );
	if ( dashArray ) {
		line.setAttribute( 'stroke-dasharray', dashArray );
	}
	return line;
}

function createCircle( cx, cy, r, fill ) {
	const circle = document.createElementNS( SVG_NS, 'circle' );
	circle.setAttribute( 'cx', cx );
	circle.setAttribute( 'cy', cy );
	circle.setAttribute( 'r', r );
	circle.setAttribute( 'fill', fill );
	return circle;
}

function createText( x, y, content, fontSize ) {
	const text = document.createElementNS( SVG_NS, 'text' );
	text.setAttribute( 'x', x );
	text.setAttribute( 'y', y );
	text.setAttribute( 'font-size', fontSize );

	const lines = content.split( '\n' );
	if ( lines.length > 1 ) {
		lines.forEach( ( line, i ) => {
			const tspan = document.createElementNS( SVG_NS, 'tspan' );
			tspan.textContent = line;
			tspan.setAttribute( 'x', x );
			tspan.setAttribute( 'dy', i === 0 ? 0 : '1.2em' );
			text.appendChild( tspan );
		} );
	} else {
		text.textContent = content;
	}
	return text;
}

function renderIndicator( svg, x, y, style, color, strokeWidth, size ) {
	if ( style === 'none' ) {
		return null;
	}
	const group = document.createElementNS( SVG_NS, 'g' );

	switch ( style ) {
		case 'circle-dot': {
			const outer = createCircle( x, y, size, 'none' );
			outer.setAttribute( 'stroke', color );
			outer.setAttribute( 'stroke-width', strokeWidth );
			group.appendChild( outer );
			group.appendChild( createCircle( x, y, 0.1, color ) );
			break;
		}
		case 'solid-circle':
			group.appendChild( createCircle( x, y, size, color ) );
			break;
		case 'hollow-circle': {
			const hollow = createCircle( x, y, size, 'none' );
			hollow.setAttribute( 'stroke', color );
			hollow.setAttribute( 'stroke-width', strokeWidth );
			group.appendChild( hollow );
			break;
		}
		case 'square': {
			const sq = document.createElementNS( SVG_NS, 'rect' );
			sq.setAttribute( 'x', x - size );
			sq.setAttribute( 'y', y - size );
			sq.setAttribute( 'width', size * 2 );
			sq.setAttribute( 'height', size * 2 );
			sq.setAttribute( 'fill', color );
			group.appendChild( sq );
			break;
		}
		case 'diamond': {
			const diamond = document.createElementNS( SVG_NS, 'polygon' );
			const s = size * 1.2;
			diamond.setAttribute( 'points', `${ x },${ y - s } ${ x + s },${ y } ${ x },${ y + s } ${ x - s },${ y }` );
			diamond.setAttribute( 'fill', color );
			group.appendChild( diamond );
			break;
		}
	}
	svg.appendChild( group );
	return group;
}

function renderConnection( svg, bx, by, task, radius, isVertical, stepId, owner, taskIndex, settings ) {
	const labelX = task.lineX;
	const labelY = isVertical ? task.lineY : by + task.lineY;
	const angle = Math.atan2( labelY - by, labelX - bx );

	let xShift = 0;
	let yShift = 0;
	if ( task.anchor ) {
		if ( ! isVertical ) {
			xShift = task.anchor * radius;
		} else {
			yShift = task.anchor * radius;
		}
	}

	let startX = bx + radius * Math.cos( angle );
	let startY = by + radius * Math.sin( angle );

	if ( xShift !== 0 && ! isVertical ) {
		let targetX = bx + xShift;
		targetX = Math.max( bx - radius, Math.min( bx + radius, targetX ) );
		startX = targetX;
		const dx = startX - bx;
		const dy = Math.sqrt( Math.max( 0, radius * radius - dx * dx ) );
		startY = by + ( Math.sin( angle ) >= 0 ? dy : -dy );
	}

	if ( yShift !== 0 && isVertical ) {
		let targetY = by + yShift;
		targetY = Math.max( by - radius, Math.min( by + radius, targetY ) );
		startY = targetY;
		const dy = startY - by;
		const dx = Math.sqrt( Math.max( 0, radius * radius - dy * dy ) );
		startX = bx + ( Math.cos( angle ) >= 0 ? dx : -dx );
	}

	let dashArray = null;
	if ( settings.connectionType === 'dashed' ) {
		dashArray = '0.2, 0.2';
	} else if ( settings.connectionType === 'dotted' ) {
		dashArray = '0.05, 0.15';
	}

	const sizeMap = { M: 0.3, L: 0.4, XL: 0.5, XXL: 0.6, '3XL': 0.7, '4XL': 0.8 };
	const fontSize = sizeMap[ task.fontSize ] || sizeMap.M;
	const weightMap = { light: 300, regular: 400, black: 900 };
	const fontWeight = weightMap[ task.fontWeight ] || 400;

	const textLines = task.label.split( '\n' );
	const longestLine = textLines.reduce( ( max, l ) => ( l.length > max.length ? l : max ), '' );
	const charWidth = fontSize * 0.6;
	const lineHeight = fontSize * 1.2;
	const rectW = longestLine.length * charWidth;
	const rectH = textLines.length * lineHeight;
	const halfW = rectW / 2;
	const halfH = rectH / 2;

	const dxLine = labelX - startX;
	const dyLine = labelY - startY;
	const revAngle = Math.atan2( dyLine, dxLine ) + Math.PI;
	const cos = Math.cos( revAngle );
	const sin = Math.sin( revAngle );

	let dBox = 0;
	if ( Math.abs( cos ) * halfH > Math.abs( sin ) * halfW ) {
		dBox = halfW / Math.abs( cos );
	} else {
		dBox = halfH / Math.abs( sin );
	}

	const paddingDistance = dBox + settings.connectionPadding;
	const distToLabel = Math.sqrt( dxLine * dxLine + dyLine * dyLine );
	const shrinkFactor = ( distToLabel - paddingDistance ) / distToLabel;

	const endX = startX + dxLine * Math.max( 0, shrinkFactor );
	const endY = startY + dyLine * Math.max( 0, shrinkFactor );

	const line = createLine( startX, startY, endX, endY, settings.connectionWidth, dashArray );
	line.classList.add( 'connection-line' );
	line.setAttribute( 'stroke', settings.connectionColor );
	line.dataset.stepId = stepId;
	line.dataset.taskType = owner;
	line.dataset.taskIndex = taskIndex;
	svg.appendChild( line );

	const indicator = renderIndicator(
		svg, startX, startY,
		settings.indicatorStyle, settings.indicatorColor,
		settings.indicatorStrokeWidth, settings.indicatorSize
	);
	if ( indicator ) {
		indicator.classList.add( 'draggable-indicator' );
		indicator.dataset.stepId = stepId;
		indicator.dataset.taskType = owner;
		indicator.dataset.taskIndex = taskIndex;
	}

	const label = createText( labelX, labelY, task.label, fontSize );
	label.classList.add( 'label-text' );
	label.setAttribute( 'fill', settings.textColor );
	label.setAttribute( 'font-weight', fontWeight );
	label.dataset.stepId = stepId;
	label.dataset.taskType = owner;
	label.dataset.taskIndex = taskIndex;

	if ( textLines.length > 1 ) {
		const yOffset = ( -( textLines.length - 1 ) * fontSize * 1.2 ) / 2;
		label.setAttribute( 'transform', `translate(0, ${ yOffset })` );
		label.setAttribute( 'text-anchor', 'middle' );
	} else {
		label.setAttribute( 'dominant-baseline', 'middle' );
		label.setAttribute( 'text-anchor', 'middle' );
	}

	svg.appendChild( label );

	// Hover interactions
	const addHover = ( el ) => {
		el.addEventListener( 'mouseenter', () => {
			const bubble = svg.querySelector( `.bubble[data-id="${ stepId }"]` );
			if ( bubble ) {
				bubble.classList.add( 'bubble-highlighted' );
			}
			svg.querySelectorAll( `.connection-line[data-step-id="${ stepId }"]` ).forEach( ( l ) => l.classList.add( 'highlighted' ) );
			svg.querySelectorAll( `.label-text[data-step-id="${ stepId }"]` ).forEach( ( l ) => l.classList.add( 'highlighted' ) );
			svg.querySelectorAll( `.draggable-indicator[data-step-id="${ stepId }"]` ).forEach( ( l ) => l.classList.add( 'highlighted' ) );
		} );
		el.addEventListener( 'mouseleave', () => {
			const bubble = svg.querySelector( `.bubble[data-id="${ stepId }"]` );
			if ( bubble ) {
				bubble.classList.remove( 'bubble-highlighted' );
			}
			svg.querySelectorAll( `.connection-line[data-step-id="${ stepId }"]` ).forEach( ( l ) => l.classList.remove( 'highlighted' ) );
			svg.querySelectorAll( `.label-text[data-step-id="${ stepId }"]` ).forEach( ( l ) => l.classList.remove( 'highlighted' ) );
			svg.querySelectorAll( `.draggable-indicator[data-step-id="${ stepId }"]` ).forEach( ( l ) => l.classList.remove( 'highlighted' ) );
		} );
	};

	addHover( label );
	if ( indicator ) {
		addHover( indicator );
	}
}

function renderStep( svg, step, centerLine, isVertical, phases, settings ) {
	const phase = phases[ step.phase ];
	if ( ! phase ) {
		return;
	}
	const bubbleColor = ( settings.colors && settings.colors[ step.phase ] ) || phase.color;
	const bubbleSize = getBubbleSize( step.size );
	const radius = bubbleSize / 2;
	const bx = step.x;
	const by = isVertical ? step.y : centerLine;

	const circle = createCircle( bx, by, radius, bubbleColor );
	circle.classList.add( 'bubble' );
	circle.dataset.id = step.id;
	circle.dataset.phase = step.phase;
	circle.style.mixBlendMode = settings.bubbleBlendMode || 'multiply';

	circle.addEventListener( 'mouseenter', () => {
		circle.classList.add( 'bubble-highlighted' );
		svg.querySelectorAll( `.connection-line[data-step-id="${ step.id }"]` ).forEach( ( l ) => l.classList.add( 'highlighted' ) );
		svg.querySelectorAll( `.label-text[data-step-id="${ step.id }"]` ).forEach( ( l ) => l.classList.add( 'highlighted' ) );
		svg.querySelectorAll( `.draggable-indicator[data-step-id="${ step.id }"]` ).forEach( ( l ) => l.classList.add( 'highlighted' ) );
	} );
	circle.addEventListener( 'mouseleave', () => {
		circle.classList.remove( 'bubble-highlighted' );
		svg.querySelectorAll( `.connection-line[data-step-id="${ step.id }"]` ).forEach( ( l ) => l.classList.remove( 'highlighted' ) );
		svg.querySelectorAll( `.label-text[data-step-id="${ step.id }"]` ).forEach( ( l ) => l.classList.remove( 'highlighted' ) );
		svg.querySelectorAll( `.draggable-indicator[data-step-id="${ step.id }"]` ).forEach( ( l ) => l.classList.remove( 'highlighted' ) );
	} );

	svg.appendChild( circle );

	const renderTasks = ( tasks, owner ) => {
		if ( ! tasks ) {
			return;
		}
		const arr = Array.isArray( tasks ) ? tasks : [ tasks ];
		arr.forEach( ( task, index ) => {
			renderConnection( svg, bx, by, task, radius, isVertical, step.id, owner, index, settings );
		} );
	};

	renderTasks( step.preface, 'preface' );
	renderTasks( step.client, 'client' );
}

function renderHorizontal( container, steps, phases, settings ) {
	const width = 50;
	const height = 20;
	const paddingPercent = ( settings.timelinePadding || 0 ) / 100;
	const paddingX = width * paddingPercent;

	const svg = document.createElementNS( SVG_NS, 'svg' );
	svg.setAttribute( 'viewBox', `0 0 ${ width } ${ height }` );
	svg.classList.add( 'ppt-svg' );

	const centerY = height / 2;

	const tl = createLine( paddingX, centerY, width - paddingX, centerY, settings.timelineWidth );
	tl.classList.add( 'timeline-line' );
	tl.setAttribute( 'stroke', settings.timelineColor );
	svg.appendChild( tl );

	const prefaceLabel = createText( 1, centerY - 6.5, 'PREFACE', 0.4 );
	prefaceLabel.classList.add( 'owner-label' );
	prefaceLabel.setAttribute( 'text-anchor', 'start' );
	svg.appendChild( prefaceLabel );

	const clientLabel = createText( 1, centerY + 7, 'CLIENT', 0.4 );
	clientLabel.classList.add( 'owner-label' );
	clientLabel.setAttribute( 'text-anchor', 'start' );
	svg.appendChild( clientLabel );

	const sorted = [ ...steps ].sort( ( a, b ) => b.size - a.size );
	sorted.forEach( ( step ) => {
		renderStep( svg, step, centerY, false, phases, settings );
	} );

	container.appendChild( svg );
}

function renderVertical( container, steps, phases, settings ) {
	const width = 20;
	const height = 50;
	const paddingPercent = ( settings.timelinePadding || 0 ) / 100;
	const paddingY = height * paddingPercent;

	const svg = document.createElementNS( SVG_NS, 'svg' );
	svg.setAttribute( 'viewBox', `0 0 ${ width } ${ height }` );
	svg.classList.add( 'ppt-svg' );

	const centerX = width / 2;

	const tl = createLine( centerX, paddingY, centerX, height - paddingY, settings.timelineWidth );
	tl.classList.add( 'timeline-line' );
	tl.setAttribute( 'stroke', settings.timelineColor );
	svg.appendChild( tl );

	const prefaceLabel = createText( centerX - 6.5, 2, 'PREFACE', 0.4 );
	prefaceLabel.classList.add( 'owner-label' );
	prefaceLabel.setAttribute( 'text-anchor', 'middle' );
	svg.appendChild( prefaceLabel );

	const clientLabel = createText( centerX + 6.5, 2, 'CLIENT', 0.4 );
	clientLabel.classList.add( 'owner-label' );
	clientLabel.setAttribute( 'text-anchor', 'middle' );
	svg.appendChild( clientLabel );

	const sorted = [ ...steps ].sort( ( a, b ) => b.size - a.size );
	sorted.forEach( ( step ) => {
		const prefaceArray = step.preface ? ( Array.isArray( step.preface ) ? step.preface : [ step.preface ] ) : null;
		const clientArray = step.client ? ( Array.isArray( step.client ) ? step.client : [ step.client ] ) : null;

		const vStep = {
			...step,
			x: centerX,
			y: step.x,
			preface: prefaceArray
				? prefaceArray.map( ( t ) => ( {
					...t,
					lineX: centerX - Math.abs( t.lineY ),
					lineY: t.lineX,
				} ) )
				: null,
			client: clientArray
				? clientArray.map( ( t ) => ( {
					...t,
					lineX: centerX + Math.abs( t.lineY ),
					lineY: t.lineX,
				} ) )
				: null,
		};

		renderStep( svg, vStep, centerX, true, phases, settings );
	} );

	container.appendChild( svg );
}

/**
 * Main render function.
 *
 * @param {HTMLElement} container - DOM element to render into.
 * @param {Array}       steps    - Timeline step data.
 * @param {Object}      phases   - Phase definitions.
 * @param {Object}      settings - Visual settings.
 * @param {string}      viewMode - 'horizontal' or 'vertical'.
 */
export function renderTimeline( container, steps, phases, settings, viewMode ) {
	if ( ! container ) {
		return;
	}
	container.innerHTML = '';

	if ( ! steps || steps.length === 0 ) {
		container.innerHTML = '<p style="text-align:center;color:#999;padding:2rem;">No timeline data. Add bubbles in the block settings.</p>';
		return;
	}

	// Apply CSS custom properties
	const el = container.closest( '.ppt-block' ) || container.parentElement;
	if ( el ) {
		el.style.setProperty( '--bubble-hover-scale', settings.bubbleHoverScale || 1.05 );
		el.style.setProperty( '--connection-hover-color', settings.connectionHoverColor || '#e63946' );
		el.style.setProperty( '--connection-hover-width', settings.connectionHoverWidth || 0.1 );
		el.style.setProperty( '--indicator-hover-stroke', settings.indicatorHoverStroke || 0.1 );
		el.style.setProperty( '--connection-hover-text-scale', settings.connectionHoverTextScale || 1 );
		el.style.setProperty( '--bubble-blend-mode', settings.bubbleBlendMode || 'multiply' );
		if ( settings.fontFamily ) {
			el.style.fontFamily = settings.fontFamily;
		}
	}

	if ( viewMode === 'vertical' ) {
		renderVertical( container, steps, phases, settings );
	} else {
		renderHorizontal( container, steps, phases, settings );
	}
}
