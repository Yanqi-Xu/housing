wrangle_pdf <-  function(path = NA){

  #create listing year from file name as identifier
  listing_year <- str_extract(path, "20\\d{2}")
# generate a vector of all CT towns. Here another misnomer North is included because some of the town names were truncated.
ct_towns <- c("Andover", "Ashford", "Avon", "Barkhamsted", "Beacon Falls", 
              "Berlin", "Bethany", "Bethel", "Bethlehem", "Bolton", "Bozrah", 
              "Branford", "Bridgewater", "Brookfield", "Brooklyn", "Burlington", 
              "Canaan", "Canterbury", "Canton", "Chaplin", "Cheshire", "Chester", 
              "Clinton", "Colchester", "Colebrook", "Columbia", "Cornwall", 
              "Coventry", "Cromwell", "Darien", "Deep River", "Durham", "Eastford", 
              "East Granby", "East Haddam", "East Hampton", "East Haven", "East Lyme", 
              "Easton", "Ellington", "Essex", "Fairfield", "Farmington", "Franklin", 
              "Glastonbury", "Goshen", "Granby", "Greenwich", "Griswold", "Guilford", 
              "Haddam", "Hamden", "Hampton", "Hartland", "Harwinton", "Hebron", 
              "Kent", "Killingworth", "Lebanon", "Ledyard", "Lisbon", "Litchfield", 
              "Lyme", "Madison", "Mansfield", "Marlborough", "Middlebury", 
              "Middlefield", "Milford", "Monroe", "Montville", "Morris", "Naugatuck", 
              "New Canaan", "New Fairfield", "New Hartford", "Newington", "New Milford", 
              "Newtown", "Norfolk", "North Branford", "North Canaan", "North Haven", 
              "North Stonington", "Old Lyme", "Old Saybrook", "Orange", "Oxford", 
              "Plainville", "Plymouth", "Pomfret", "Portland", "Preston", "Prospect", 
              "Redding", "Ridgefield", "Rocky Hill", "Roxbury", "Salem", "Salisbury", 
              "Scotland", "Seymour", "Sharon", "Shelton", "Sherman", "Simsbury", 
              "Somers", "Southbury", "Southington", "South Windsor", "Sprague", 
              "Stafford", "Sterling", "Stonington", "Stratford", "Suffield", 
              "Thomaston", "Thompson", "Tolland", "Trumbull", "Union", "Voluntown", 
              "Wallingford", "Warren", "Washington", "Waterford", "Watertown", 
              "Westbrook", "West Hartford", "Weston", "Westport", "Wethersfield", 
              "Willington", "Wilton", "Windsor", "Windsor Locks", "Wolcott", 
              "Woodbridge", "Woodbury", "Woodstock", "Ansonia", "Bloomfield", 
              "Bridgeport", "Bristol", "Danbury", "Derby", "East Hartford", 
              "East Windsor", "Enfield", "Groton", "Hartford", "Killingly", 
              "Manchester", "Meriden", "Middletown", "New Britain", "New Haven", 
              "New London", "Norwalk", "Norwich", "Plainfield", "Putnam", "Stamford", 
              "Torrington", "Vernon", "Waterbury", "West Haven", "Winchester", 
              "Windham", "North")

# method 2: Valid_posit only captures lines that have valid ct_town names.We'll create a regex to do it.
ct_towns_reg <- str_c(ct_towns, collapse = "|")

  # Create logic to read true pdfs and real pdfs differently.
  if (listing_year %in% c("2011", "2016")) {
    ct <- pdf_ocr_text(path, language = "eng")
    ct <- ct %>% read_lines() 
    
    valid_posit <- which(str_detect(ct, ct_towns_reg))
    
    lines <- ct[valid_posit] 
    
    lines_proc <- lines %>% str_squish()
    
    
    town <- str_extract(lines_proc,ct_towns_reg) %>% trimws()
    
    fields <- lines_proc %>%  trimws() %>% str_remove_all("/") %>% str_remove("\\d*\\s*\\D+")
    
    percent_afford <- fields %>% str_extract("\\d{1,2}\\.{0,1}\\d{0,4}%")
    
    lines_tib <- cbind(town, percent_afford) %>% as_tibble()
    
    tib <- lines_tib %>% 
      mutate(year = listing_year)
    
  } else{
ct <- pdf_text(path) 

ct <- ct %>% read_lines() 

valid_posit <- which(str_detect(ct, ct_towns_reg))

lines <- ct[valid_posit] 

lines_proc <- lines %>% str_squish()

town <- str_extract(lines_proc,ct_towns_reg) %>% trimws()

fields <- lines_proc %>%  trimws() %>% str_remove("\\d*\\s*\\D+")

all_lines <- fields %>% str_split(" ") 

percent_afford <- c()
# We only need the column `town` and percent_affordable and we'll only extract those fields
for (i in seq_along(all_lines)) {
  percent_afford[i] <- all_lines[[i]][length(all_lines[[i]])] 
}
lines_tib <- cbind(town, percent_afford) %>% as_tibble()

tib <- lines_tib %>% 
  mutate(year = listing_year)
}

tib <- tib %>% 
  mutate_at(.vars = vars(-town), .funs = ~str_remove(.,"\\%|,|%") %>% as.numeric(.)) %>% 
  mutate(exmp_status = case_when(percent_afford > 10 ~ "Exempt", TRUE ~ "Non-Exempt"
         ))
  
return(tib)
}
