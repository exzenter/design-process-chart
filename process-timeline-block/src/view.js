/**
 * Frontend interactivity for the Process Timeline block.
 * Handles view toggling, version switching, and responsive layout.
 */

import { renderTimeline } from './timeline-renderer';

document.addEventListener( 'DOMContentLoaded', () => {
	const blocks = document.querySelectorAll( '.ppt-block' );
	blocks.forEach( ( block ) => initBlock( block ) );
} );

function initBlock( block ) {
	const container = block.querySelector( '.ppt-timeline-container' );
	if ( ! container ) {
		return;
	}

	// Parse data from attributes
	let steps, phases, settings, versions, responsive;
	try {
		steps = JSON.parse( block.dataset.steps || '[]' );
		phases = JSON.parse( block.dataset.phases || '{}' );
		settings = JSON.parse( block.dataset.settings || '{}' );
		versions = JSON.parse( block.dataset.versions || '{}' );
		responsive = JSON.parse( block.dataset.responsive || '{}' );
	} catch {
		return;
	}

	const breakpoint = responsive.breakpoint || 768;
	const mobileLayout = responsive.mobileLayout || 'vertical';
	const desktopLayout = responsive.desktopLayout || 'horizontal';

	let currentView = window.innerWidth <= breakpoint ? mobileLayout : desktopLayout;
	let currentSteps = steps;
	let currentSettings = settings;
	let activeVersion = '';

	// Render function
	const render = () => {
		renderTimeline( container, currentSteps, phases, currentSettings, currentView );

		// Update wrapper class
		const wrapper = block.querySelector( '.ppt-timeline-wrapper' );
		if ( wrapper ) {
			wrapper.classList.remove( 'ppt-timeline-wrapper--horizontal', 'ppt-timeline-wrapper--vertical' );
			wrapper.classList.add( `ppt-timeline-wrapper--${ currentView }` );
		}

		// Update button states
		block.querySelectorAll( '.ppt-view-btn' ).forEach( ( btn ) => {
			btn.classList.toggle( 'active', btn.dataset.view === currentView );
		} );

		// Update version button states
		block.querySelectorAll( '.ppt-version-btn' ).forEach( ( btn ) => {
			btn.classList.toggle( 'active', btn.dataset.version === activeVersion );
		} );
	};

	// View toggle buttons
	block.querySelectorAll( '.ppt-view-btn' ).forEach( ( btn ) => {
		btn.addEventListener( 'click', () => {
			currentView = btn.dataset.view;
			render();

			// Dispatch custom event
			block.dispatchEvent( new CustomEvent( 'ppt:viewChange', {
				detail: { view: currentView },
				bubbles: true,
			} ) );
		} );
	} );

	// Build version buttons
	const versionContainer = block.querySelector( '.ppt-version-buttons' );
	if ( versionContainer && Object.keys( versions ).length > 0 ) {
		Object.keys( versions ).forEach( ( name ) => {
			const btn = document.createElement( 'button' );
			btn.className = 'ppt-version-btn';
			btn.textContent = name;
			btn.dataset.version = name;
			btn.addEventListener( 'click', () => {
				const v = versions[ name ];
				if ( ! v ) {
					return;
				}
				activeVersion = name;
				currentSteps = v.steps;
				if ( v.settings ) {
					currentSettings = v.settings;
				}
				render();

				// Dispatch custom event
				block.dispatchEvent( new CustomEvent( 'ppt:versionChange', {
					detail: { version: name },
					bubbles: true,
				} ) );
			} );
			versionContainer.appendChild( btn );
		} );
	}

	// Responsive: switch layout on resize
	let resizeTimer;
	window.addEventListener( 'resize', () => {
		clearTimeout( resizeTimer );
		resizeTimer = setTimeout( () => {
			const newView = window.innerWidth <= breakpoint ? mobileLayout : desktopLayout;
			if ( newView !== currentView ) {
				currentView = newView;
				render();

				block.dispatchEvent( new CustomEvent( 'ppt:responsiveChange', {
					detail: { view: currentView, width: window.innerWidth },
					bubbles: true,
				} ) );
			}
		}, 150 );
	} );

	// Expose API for external JS
	block.pptTimeline = {
		setView( view ) {
			if ( view === 'horizontal' || view === 'vertical' ) {
				currentView = view;
				render();
			}
		},
		loadVersion( name ) {
			const v = versions[ name ];
			if ( v ) {
				activeVersion = name;
				currentSteps = v.steps;
				if ( v.settings ) {
					currentSettings = v.settings;
				}
				render();
			}
		},
		getView() {
			return currentView;
		},
		getActiveVersion() {
			return activeVersion;
		},
	};

	// Initial render
	render();
}
