import {
  Component,
  ViewChild,
  ElementRef,
  OnInit,
  OnDestroy
} from '@angular/core';
import {
  GoogleMaps,
  GoogleMap,
  GoogleMapsEvent,
  LatLng,
  MarkerOptions,
  Marker,
  HtmlInfoWindow,
  PolylineOptions,
  Spherical
} from '@ionic-native/google-maps';
import { Platform } from '@ionic/angular';
import { interval } from 'rxjs';

declare var google;

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss']
})
export class HomePage implements OnDestroy {
  @ViewChild('map', { static: true }) mapContainer: ElementRef;
  @ViewChild('directionsPanel', { static: true }) directionsPanel: ElementRef;

  map: GoogleMap;
  private subscription;
  directionsService = new google.maps.DirectionsService();
  directionsDisplay = new google.maps.DirectionsRenderer();

  mapDriverMaker = new Map<number, Marker>();

  myCurrentLocation = {
    lat: 10.811150000000001,
    lng: 106.64393000000001,
    name: 'My location'
  };

  driverNearLocation = [
    { id: 1, lat: 10.914971, lng: 106.6438, name: 'driver 1' },
    { id: 2, lat: 10.815292, lng: 106.6438, name: 'driver 2' }
  ];

  constructor(public plt: Platform) {}

  ionViewDidEnter() {
    this.plt.ready().then(() => {
      this.initMap();
      this.subscription = interval(1000).subscribe(val => {
        this.driverChange();
      });
    });
  }

  driverChange() {
    // this.driverNearLocation = this.driverNearLocation.map(value => ({
    //   ...value,
    //   lng: value.lng + 0.0003,
    //   lat: value.lat
    // }));
    // this.driverNearLocation.forEach(value => {
    //   const marker = this.mapDriverMaker.get(value.id);
    //   this.moveMarkerPath(
    //     marker,
    //     new LatLng(value.lat, value.lng),
    //     new LatLng(this.myCurrentLocation.lat, this.myCurrentLocation.lng)
    //   );
    // });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  initMap() {
    this.map = GoogleMaps.create(this.mapContainer.nativeElement);

    this.map.one(GoogleMapsEvent.MAP_READY).then((data: any) => {
      this.driverNearLocation.forEach(value => {
        this.addMarkerDriver(value);
      });

      let coordinatesMyCurrent: LatLng = new LatLng(
        this.myCurrentLocation.lat,
        this.myCurrentLocation.lng
      );

      let position = {
        target: coordinatesMyCurrent,
        zoom: 17
      };

      this.map.animateCamera(position);

      let markerOptions: MarkerOptions = {
        position: coordinatesMyCurrent
        // icon: 'assets/images/icons8-Marker-64.png',
      };

      this.map.addMarker(markerOptions).then((marker: Marker) => {
        const htmlInfoWindow = this.createHtmlInfo(this.myCurrentLocation);
        marker.addEventListener(GoogleMapsEvent.MARKER_CLICK).subscribe(res => {
          htmlInfoWindow.open(marker);
        });
      });

      this.map
        .addMarker({
          icon: 'blue',
          animation: 'DROP',
          draggable: true,
          position: coordinatesMyCurrent
        })
        .then((marker: Marker) => {
          marker.on(GoogleMapsEvent.MARKER_DRAG_END).subscribe(() => {
            console.log(marker.getPosition());

            // localStorage.setItem('latt1', this.markerlatlong.lat);
            // localStorage.setItem('long1', this.markerlatlong.lng);

            // this.http
            //   .get('API URL')
            //   .map(res => res.json())
            //   .subscribe(data => {
            //     console.log(data);
            //   });
          });
        });
    });
  }

  createHtmlInfo(info) {
    let htmlInfoWindow = new HtmlInfoWindow();
    let frame: HTMLElement = document.createElement('div');
    frame.innerHTML = [info.name].join('');
    htmlInfoWindow.setContent(frame, {
      width: '15px',
      height: '19px'
    });
    return htmlInfoWindow;
  }

  addMarkerDriver(value) {
    let driverLocation = new LatLng(value.lat, value.lng);
    let markerOptionsDriver: MarkerOptions = {
      position: driverLocation,
      // icon: {
      //   size: { width: 37, height: 49 },
      //   url: 'assets/images/car.png'
      // },
      flat: true
    };

    this.map.addMarker(markerOptionsDriver).then((marker: Marker) => {
      const htmlInfoWindow = this.createHtmlInfo(value);
      this.mapDriverMaker.set(value.id, marker);

      marker.addEventListener(GoogleMapsEvent.MARKER_CLICK).subscribe(res => {
        htmlInfoWindow.open(marker);
      });
    });
  }

  updateMarker(marker: Marker, newLat, newLng) {
    marker.setPosition(new LatLng(newLat, newLng));
  }

  removeMarker(marker: Marker) {
    marker.remove();
  }

  moveMarkerPath(marker: Marker, newLatLgDriver) {
    const postLocation = marker.getPosition();
    marker.setPosition(newLatLgDriver);
    let heading = Spherical.computeHeading(newLatLgDriver, postLocation);
    heading = heading - 180 ? heading - 180 : heading + 180;
    marker.setRotation(heading);
  }

  testDirector() {
    this.calculateAndDisplayRoute(
      new LatLng(this.myCurrentLocation.lat, this.myCurrentLocation.lng),
      new LatLng(this.driverNearLocation[0].lat, this.driverNearLocation[0].lng)
    );
  }

  calculateAndDisplayRoute(latLngA, latLngB) {
    // this.directionsDisplay.setMap(this.map);
    this.directionsDisplay.setPanel(this.directionsPanel.nativeElement);

    this.directionsService.route(
      {
        origin: latLngA,
        destination: latLngB,
        travelMode: 'DRIVING'
      },
      (response, status) => {
        if (status === 'OK') {
          const routes = response.routes[0].overview_path.map(value => {
            return { lat: value.lat(), lng: value.lng() };
          });

          let options: PolylineOptions = {
            points: routes,
            color: '#AA00FF',
            width: 10,
            geodesic: true,
            clickable: true
          };

          this.map.addPolyline(options);
          this.directionsDisplay.setDirections(response);
        }
      }
    );
  }

  leftDriver() {
    const headDriver = this.driverNearLocation[1];
    const marker = this.mapDriverMaker.get(headDriver.id);
    console.log(headDriver.lat, headDriver.lng + 0.0003);
    headDriver.lng = headDriver.lng + 0.0003;
    this.moveMarkerPath(marker, new LatLng(headDriver.lat, headDriver.lng));
  }

  rightDriver() {
    const headDriver = this.driverNearLocation[1];
    const marker = this.mapDriverMaker.get(headDriver.id);
    headDriver.lng = headDriver.lng - 0.0003;
    console.log(headDriver.lat, headDriver.lng);
    this.moveMarkerPath(marker, new LatLng(headDriver.lat, headDriver.lng));
  }

  topDriver() {
    const headDriver = this.driverNearLocation[1];
    const marker = this.mapDriverMaker.get(headDriver.id);
    headDriver.lat = headDriver.lat + 0.0003;

    this.moveMarkerPath(marker, new LatLng(headDriver.lat, headDriver.lng));
  }
  downDriver() {
    const headDriver = this.driverNearLocation[1];
    const marker = this.mapDriverMaker.get(headDriver.id);
    headDriver.lat = headDriver.lat - 0.0003;

    this.moveMarkerPath(marker, new LatLng(headDriver.lat, headDriver.lng));
  }
}
